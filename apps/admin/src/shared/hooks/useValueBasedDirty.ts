import { useCallback, useEffect, useState } from "react";

import { formDataEqual } from "@/shared/lib/form/formDataEqual";

/**
 * Value-based isDirty for forms.
 *
 * Avoids TanStack Form's reference-based isDirty for untouched forms.
 * In edit mode, only treats as dirty after form values have matched initialData
 * at least once, so initial "stale store" frames after reset don't show as dirty.
 *
 * @param currentValues - Current form values (from form store or state)
 * @param initialData - Initial/expected values (null = create mode)
 * @param keys - Keys to compare for equality
 * @param defaultInitial - Default for reset when no nextInitial passed (create mode)
 */
export function useValueBasedDirty<T extends object>(
  currentValues: T,
  initialData: T | null | undefined,
  keys: readonly (keyof T)[],
  defaultInitial: T
): {
  isDirty: boolean;
  reset: (nextInitial?: T | null) => void;
  setBaseline: React.Dispatch<React.SetStateAction<T>>;
  setHasSeenFormMatchingInitial: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const [hasSeenFormMatchingInitial, setHasSeenFormMatchingInitial] =
    useState(false);
  const [baseline, setBaseline] = useState<T>(() =>
    initialData ? { ...initialData } : { ...defaultInitial }
  );

  const matchesBaseline = formDataEqual(currentValues, baseline, keys);
  const matchesInitialData =
    initialData != null && formDataEqual(currentValues, initialData, keys);

  useEffect(() => {
    if (
      initialData != null &&
      formDataEqual(currentValues, initialData, keys)
    ) {
      queueMicrotask(() => setHasSeenFormMatchingInitial(true));
    }
  }, [initialData, currentValues, keys]);

  const valueDirty = !matchesBaseline && !matchesInitialData;
  const isDirty =
    initialData != null ? hasSeenFormMatchingInitial && valueDirty : valueDirty;

  const reset = useCallback(
    (nextInitial?: T | null) => {
      const next = nextInitial ?? initialData ?? defaultInitial;
      setBaseline({ ...next });
    },
    [initialData, defaultInitial]
  );

  return {
    isDirty,
    reset,
    setBaseline,
    setHasSeenFormMatchingInitial,
  };
}
