type FieldMeta = {
  errorMap?: Record<string, unknown>;
  errorSourceMap?: Record<string, string | undefined>;
};

type FormApiWithFieldMeta = {
  baseStore: {
    state: {
      fieldMetaBase: Record<string, FieldMeta | undefined>;
    };
  };
  setFieldMeta: (field: string, updater: (prev: unknown) => unknown) => void;
};

function clearMatchingFormScopedOnSubmitFieldErrors(
  formApi: unknown,
  shouldClear: (path: string) => boolean
): void {
  const form = formApi as FormApiWithFieldMeta;
  const paths = Object.keys(form.baseStore.state.fieldMetaBase);

  for (const path of paths) {
    if (!shouldClear(path)) continue;

    const meta = form.baseStore.state.fieldMetaBase[path];
    if (meta?.errorSourceMap?.onSubmit !== "form") continue;

    form.setFieldMeta(path, (prev) => {
      const previousMeta = prev as FieldMeta | null;
      if (!previousMeta || previousMeta.errorSourceMap?.onSubmit !== "form") {
        return prev;
      }

      const errorMap = { ...previousMeta.errorMap };
      const errorSourceMap = { ...previousMeta.errorSourceMap };

      delete errorMap.onSubmit;
      delete errorSourceMap.onSubmit;

      return { ...previousMeta, errorMap, errorSourceMap };
    });
  }
}

/**
 * TanStack Form runs validateAllFields("submit") with skipFormValidation before
 * form-level validators.onSubmit. Form-returned { fields } errors are stored as
 * errorMap.onSubmit with errorSourceMap.onSubmit === "form". That combination is
 * not cleared by field validators when the field has no onSubmit validator, so
 * isFieldsValid stays false and validators.onSubmit never runs again — clear
 * these before each submit attempt.
 *
 * @param fieldNames When set, only clears form-scoped submit errors on these paths
 * (e.g. paired date fields when one changes so cross-field errors update in real time).
 */
export function clearFormScopedOnSubmitFieldErrors(
  formApi: unknown,
  fieldNames?: readonly string[]
): void {
  if (!fieldNames?.length) {
    clearMatchingFormScopedOnSubmitFieldErrors(formApi, () => true);
    return;
  }

  const fieldNameSet = new Set(fieldNames);

  clearMatchingFormScopedOnSubmitFieldErrors(formApi, (path) =>
    fieldNameSet.has(path)
  );
}

export function clearFormScopedOnSubmitFieldErrorsByPrefix(
  formApi: unknown,
  prefix: string
): void {
  clearMatchingFormScopedOnSubmitFieldErrors(
    formApi,
    (path) =>
      path === prefix ||
      path.startsWith(`${prefix}.`) ||
      path.startsWith(`${prefix}[`)
  );
}
