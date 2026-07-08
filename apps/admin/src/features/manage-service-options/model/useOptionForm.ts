import { useForm, useStore } from "@tanstack/react-form";
import { useCallback } from "react";

import { useValueBasedDirty } from "@/shared/hooks/useValueBasedDirty";

import { createDefaultOperatingDaySelection } from "./operating-days";

export interface OptionFormValues {
  title: string;
  includes: string;
  excludes: string;
  contractId: string | null;
  isActive: boolean;
  timeFrom: string;
  timeTo: string;
  flightNumber: string;
  /** Mon–Sun flags, same order as `OPERATING_DAY_CODES`. */
  operatingDaySelected: boolean[];
}

export const INITIAL_OPTION_FORM: OptionFormValues = {
  title: "",
  includes: "",
  excludes: "",
  contractId: null,
  isActive: false,
  timeFrom: "",
  timeTo: "",
  flightNumber: "",
  operatingDaySelected: createDefaultOperatingDaySelection(),
};

const OPTION_DIRTY_KEYS: (keyof OptionFormValues)[] = [
  "title",
  "includes",
  "excludes",
  "isActive",
  "timeFrom",
  "timeTo",
  "flightNumber",
  "operatingDaySelected",
];

export function useOptionForm(initialData?: OptionFormValues | null) {
  const form = useForm({
    defaultValues: initialData ?? INITIAL_OPTION_FORM,
  });

  const currentValues = useStore(form.store, (state) => state.values);
  const { isDirty, reset: resetDirtyBaseline } =
    useValueBasedDirty<OptionFormValues>(
      currentValues,
      initialData,
      OPTION_DIRTY_KEYS,
      INITIAL_OPTION_FORM
    );

  const reset = useCallback(
    (nextInitial?: OptionFormValues | null) => {
      const next = nextInitial ?? initialData ?? INITIAL_OPTION_FORM;
      form.reset(next);
      resetDirtyBaseline(next);
    },
    [form, initialData, resetDirtyBaseline]
  );

  return { form, isDirty, reset };
}
