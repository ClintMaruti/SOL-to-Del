import type { AnyFormApi } from "@/shared/ui/form";

const API_FIELD_TO_FORM_FIELD: Record<string, string> = {
  agencyGroupIds: "agencyGroupIds",
  AgencyGroupIds: "agencyGroupIds",
};

function setFieldSubmitError(
  form: AnyFormApi,
  fieldName: string,
  message: string
) {
  form.setFieldMeta(fieldName as never, (previous: unknown) => {
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
    } as never;
  });
}

export function applyAgencyApiValidationErrors(
  form: AnyFormApi,
  errors: Record<string, string[]>
) {
  const formErrors: Record<string, string> = {};

  for (const [apiFieldName, messages] of Object.entries(errors)) {
    const fieldName =
      API_FIELD_TO_FORM_FIELD[apiFieldName] ??
      apiFieldName.charAt(0).toLowerCase() + apiFieldName.slice(1);
    const message = messages[0];
    if (!message) continue;
    formErrors[fieldName] = message;
    setFieldSubmitError(form, fieldName, message);
  }

  return formErrors;
}
