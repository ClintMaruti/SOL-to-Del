import type { ZodIssue } from "zod";

import { zodPathToTanStackFieldKey } from "./zod-tanstack-path";

type FormApiWithFieldMeta = {
  setFieldMeta: (field: string, updater: (prev: unknown) => unknown) => void;
};

function setFieldSubmitError(
  form: FormApiWithFieldMeta,
  path: string,
  message: string
): void {
  form.setFieldMeta(path, (previous: unknown) => {
    const meta = (previous ?? {}) as {
      isTouched?: boolean;
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
    };
  });
}

export function applyZodIssuesToFormSubmitErrors(
  formApi: unknown,
  issues: readonly ZodIssue[]
): void {
  const form = formApi as FormApiWithFieldMeta;

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
