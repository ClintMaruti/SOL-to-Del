import { useStore } from "@tanstack/react-form";

import type { AnyFormApi } from "@/shared/ui";

function dedupeErrors(errors: string[]) {
  return [...new Set(errors.filter(Boolean))];
}

export function usePromotionFieldErrors(form: AnyFormApi, name: string) {
  return useStore(form.store, (state) => {
    const fieldMeta = (
      state as {
        fieldMeta: Record<string, { errors?: string[] } | undefined>;
      }
    ).fieldMeta;

    return fieldMeta[name]?.errors ?? [];
  });
}

export function usePromotionFieldErrorsByPrefix(
  form: AnyFormApi,
  prefix: string
) {
  return useStore(form.store, (state) => {
    const fieldMeta = (
      state as {
        fieldMeta: Record<string, { errors?: string[] } | undefined>;
      }
    ).fieldMeta;

    const collectedErrors: string[] = [];

    for (const [fieldName, meta] of Object.entries(fieldMeta)) {
      if (
        fieldName === prefix ||
        fieldName.startsWith(`${prefix}.`) ||
        fieldName.startsWith(`${prefix}[`)
      ) {
        collectedErrors.push(...(meta?.errors ?? []));
      }
    }

    return dedupeErrors(collectedErrors);
  });
}
