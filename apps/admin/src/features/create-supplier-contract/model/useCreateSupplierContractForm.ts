import { useForm } from "@tanstack/react-form";

import { safeParseSubmitData } from "@/shared/lib/form";

import {
  ANY_AGENCY_GROUP_VALUE,
  attachContractSubmitSchema,
  type AttachContractSubmitData,
} from "./schema";

export interface CreateSupplierContractFormValues {
  name: string;
  link: string;
  agencyGroupId: string;
  validFrom: string;
  validTo: string;
}

const defaultValues: CreateSupplierContractFormValues = {
  name: "",
  link: "",
  agencyGroupId: ANY_AGENCY_GROUP_VALUE,
  validFrom: "",
  validTo: "",
};

export function useCreateSupplierContractForm(
  onSubmit: (data: AttachContractSubmitData) => void,
  onSchemaError?: (message: string) => void
) {
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = safeParseSubmitData(attachContractSubmitSchema, value);
      if (!result.success) {
        onSchemaError?.(result.message);
        return;
      }
      onSubmit(result.data);
    },
  });

  return { form };
}
