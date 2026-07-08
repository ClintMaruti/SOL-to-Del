import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";

import { formDataEqual } from "@/shared/lib/form";

export interface CreateAgencyGroupFormData {
  name: string;
  description: string;
  agencies: string[];
}

export const INITIAL_FORM_DATA: CreateAgencyGroupFormData = {
  name: "",
  description: "",
  agencies: [],
};

const FORM_KEYS = Object.keys(
  INITIAL_FORM_DATA
) as (keyof CreateAgencyGroupFormData)[];

export function useCreateAgencyGroupForm(
  initialData?: CreateAgencyGroupFormData | null
) {
  const prevInitialDataRef = useRef<
    CreateAgencyGroupFormData | null | undefined
  >(initialData);

  const form = useForm({
    defaultValues: initialData ?? INITIAL_FORM_DATA,
  });

  useEffect(() => {
    if (!initialData) return;
    const prev = prevInitialDataRef.current;
    const dataChanged =
      prev == null || !formDataEqual(prev, initialData, FORM_KEYS);

    if (dataChanged) {
      prevInitialDataRef.current = initialData;
      form.reset(initialData);
    }
  }, [form, initialData]);

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const reset = (nextInitial?: CreateAgencyGroupFormData | null) => {
    const next = nextInitial ?? initialData ?? INITIAL_FORM_DATA;
    prevInitialDataRef.current = next;
    form.reset(next);
  };

  return {
    form,
    isDirty,
    reset,
  };
}
