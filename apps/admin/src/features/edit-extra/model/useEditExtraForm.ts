import { useForm } from "@tanstack/react-form";
import type { ZodError, ZodIssue } from "zod";

import {
  clearFormScopedOnSubmitFieldErrors,
  safeParseSubmitData,
  zodPathToTanStackFieldKey,
} from "@/shared/lib/form";
import type { AnyFormApi } from "@/shared/ui/form";

import {
  editExtraSubmitSchema,
  type EditExtraFormValues,
  type EditExtraSubmitValues,
} from "./schema";

function setFieldSubmitError(form: AnyFormApi, path: string, message: string) {
  form.setFieldMeta(path, (previous: unknown) => {
    const meta = (previous ?? {}) as {
      errorMap?: Record<string, unknown>;
      errorSourceMap?: Record<string, string | undefined>;
    };

    return {
      ...meta,
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

function applyZodIssuesToForm(form: AnyFormApi, issues: ZodIssue[]) {
  for (const issue of issues) {
    const path = issue.path.filter(
      (segment): segment is string | number =>
        typeof segment === "string" || typeof segment === "number"
    );
    const fieldName = zodPathToTanStackFieldKey(path);
    if (!fieldName) continue;
    setFieldSubmitError(form, fieldName, issue.message);
  }
}

/** Parses submit payload; applies field errors and returns null when invalid. */
export function parseEditExtraSubmitValues(
  form: AnyFormApi,
  value: unknown
): EditExtraSubmitValues | null {
  clearFormScopedOnSubmitFieldErrors(form);
  const result = safeParseSubmitData(editExtraSubmitSchema, value);
  if (!result.success) {
    applyZodIssuesToForm(form, result.error.issues);
    return null;
  }
  return result.data;
}

export function useEditExtraForm(
  initialValues: EditExtraFormValues,
  onValidSubmit: (values: EditExtraSubmitValues) => void,
  onSchemaError?: (message: string | undefined) => void,
  onZodValidationFailed?: (error: ZodError) => void
) {
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      clearFormScopedOnSubmitFieldErrors(form);
      const result = safeParseSubmitData(editExtraSubmitSchema, value);
      if (!result.success) {
        applyZodIssuesToForm(
          form as unknown as AnyFormApi,
          result.error.issues
        );
        onSchemaError?.(undefined);
        onZodValidationFailed?.(result.error);
        return;
      }
      onValidSubmit(result.data);
    },
  });

  return { form };
}
