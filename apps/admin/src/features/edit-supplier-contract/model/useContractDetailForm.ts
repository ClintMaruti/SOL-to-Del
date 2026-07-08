import { useForm, useStore } from "@tanstack/react-form";

import { ANY_AGENCY_GROUP_VALUE } from "@/features/create-supplier-contract/model/schema";

export interface ContractDetailFormValues {
  name: string;
  link: string;
  agencyGroupId: string;
  validFrom: string;
  validTo: string;
}

const DEFAULT_VALUES: ContractDetailFormValues = {
  name: "",
  link: "",
  agencyGroupId: ANY_AGENCY_GROUP_VALUE,
  validFrom: "",
  validTo: "",
};

export function useContractDetailForm(
  initialData?: ContractDetailFormValues | null
) {
  const form = useForm({
    defaultValues: initialData ?? DEFAULT_VALUES,
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const reset = (nextInitial?: ContractDetailFormValues | null) => {
    form.reset(nextInitial ?? initialData ?? DEFAULT_VALUES);
  };

  return {
    form,
    isDirty,
    reset,
  };
}
