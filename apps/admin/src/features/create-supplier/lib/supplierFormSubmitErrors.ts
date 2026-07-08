import { toFormErrors } from "@sol/api-client";
import type { ZodIssue } from "zod";

import {
  clearFormScopedOnSubmitFieldErrors,
  getFieldNamesFromZodError,
  zodPathToTanStackFieldKey,
} from "@/shared/lib/form";
import type { AnyFormApi } from "@/shared/ui/form";

import { supplierSubmitSchema, type SupplierSubmitData } from "../model/schema";

/** Fields required on every save (draft or active). */
export const SUPPLIER_SAVE_REQUIRED_FIELD_NAMES = [
  "name",
  "headOfficeId",
  "serviceTypeId",
] as const;

/** Fields validated when activating (toggle or save with isActive). */
export const SUPPLIER_ACTIVATION_FORM_FIELD_NAMES = [
  "type",
  "countryId",
  "locationId",
  "email",
  "xeroId",
] as const;

function setFieldSubmitError(form: AnyFormApi, path: string, message: string) {
  form.setFieldMeta(path, (previous: unknown) => {
    const meta = (previous ?? {}) as {
      isTouched?: boolean;
      isBlurred?: boolean;
      isDirty?: boolean;
      isValidating?: boolean;
      errorMap?: Record<string, unknown>;
      errorSourceMap?: Record<string, string | undefined>;
    };

    return {
      ...meta,
      isTouched: true,
      errorMap: {
        ...meta.errorMap,
        onSubmit: message,
      },
      errorSourceMap: {
        ...meta.errorSourceMap,
        onSubmit: "form",
      },
    } as never;
  });
}

export type ParseSupplierSubmitResult =
  | { success: true; data: SupplierSubmitData }
  | { success: false; fieldNames: string[] };

/**
 * Validates supplier form values and maps Zod issues onto matching fields.
 */
export function parseSupplierSubmitForForm(
  form: AnyFormApi,
  values: unknown
): ParseSupplierSubmitResult {
  const result = supplierSubmitSchema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }

  applyZodIssuesToSupplierForm(form, result.error.issues);
  return {
    success: false,
    fieldNames: getFieldNamesFromZodError(result.error),
  };
}

export function applyZodIssuesToSupplierForm(
  form: AnyFormApi,
  issues: ZodIssue[]
): void {
  for (const issue of issues) {
    const path = issue.path.filter(
      (segment): segment is string | number =>
        typeof segment === "string" || typeof segment === "number"
    );
    const fieldName = zodPathToTanStackFieldKey(path);
    if (!fieldName) {
      continue;
    }

    setFieldSubmitError(form, fieldName, issue.message);
  }
}

/**
 * Maps API validation errors (e.g. RFC / ASP.NET shape) onto supplier overview form fields.
 */
export function applySupplierApiValidationErrorsToForm(
  form: AnyFormApi,
  errors: Record<string, string[]>
): void {
  const flat = toFormErrors(errors);

  for (const [fieldName, message] of Object.entries(flat)) {
    if (!message) {
      continue;
    }

    const path = fieldName === "serviceType" ? "serviceTypeId" : fieldName;
    setFieldSubmitError(form, path, message);
  }
}

export function clearSupplierActivationSubmitErrors(form: AnyFormApi): void {
  clearFormScopedOnSubmitFieldErrors(
    form,
    SUPPLIER_ACTIVATION_FORM_FIELD_NAMES as unknown as string[]
  );
}
