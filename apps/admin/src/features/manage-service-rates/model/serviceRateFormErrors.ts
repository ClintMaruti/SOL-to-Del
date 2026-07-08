import { getFieldError, toFormErrors } from "@sol/api-client";
import type { AnyFieldApi } from "@tanstack/react-form";

import type { AnyFormApi } from "@/shared/ui/form";

import type { ServiceRateFormValues } from "./schema";

const SERVICE_RATE_FORM_FIELDS = new Set<keyof ServiceRateFormValues>([
  "name",
  "chargeType",
  "timeUnit",
]);

export function zodFieldErrorsToTanStackFields(
  fieldErrors: Record<string, string[] | undefined>
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const first = messages?.find((m): m is string => typeof m === "string");
    if (first) {
      fields[key] = first;
    }
  }
  return fields;
}

function setFieldSubmitError(
  form: AnyFormApi,
  fieldName: keyof ServiceRateFormValues,
  message: string
) {
  form.setFieldMeta(fieldName, (previous: unknown) => {
    const meta = (previous ?? {}) as {
      errors?: string[];
      errorMap?: Record<string, unknown>;
      errorSourceMap?: Record<string, string | undefined>;
    };

    return {
      ...meta,
      errors: [message],
      errorMap: {
        ...meta.errorMap,
        onSubmit: message,
      },
      errorSourceMap: {
        ...meta.errorSourceMap,
        onSubmit: "form",
      },
    };
  });
}

export function applyServiceRateApiValidationErrors(
  form: AnyFormApi,
  errors: Record<string, string[]>
): boolean {
  const flat = toFormErrors(errors);
  let applied = false;

  for (const [key, message] of Object.entries(flat)) {
    const fieldName = key as keyof ServiceRateFormValues;
    if (!SERVICE_RATE_FORM_FIELDS.has(fieldName)) {
      continue;
    }
    setFieldSubmitError(form, fieldName, message);
    applied = true;
  }

  if (!applied) {
    for (const [apiFieldName, messages] of Object.entries(errors)) {
      const message = getFieldError(errors, apiFieldName) ?? messages[0];
      if (!message) {
        continue;
      }
      const camel =
        apiFieldName.charAt(0).toLowerCase() + apiFieldName.slice(1);
      const fieldName = camel as keyof ServiceRateFormValues;
      if (!SERVICE_RATE_FORM_FIELDS.has(fieldName)) {
        continue;
      }
      setFieldSubmitError(form, fieldName, message);
      applied = true;
    }
  }

  return applied;
}

export function getServiceRateFieldError(
  field: AnyFieldApi
): string | undefined {
  const meta = field.state.meta;
  const fromErrors = meta.errors?.[0];
  if (fromErrors) {
    return String(fromErrors);
  }
  const fromMap = (meta.errorMap as { onSubmit?: string } | undefined)
    ?.onSubmit;
  return typeof fromMap === "string" ? fromMap : undefined;
}
