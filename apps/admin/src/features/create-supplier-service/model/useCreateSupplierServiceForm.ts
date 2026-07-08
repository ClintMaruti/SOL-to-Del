import { useForm } from "@tanstack/react-form";

import { safeParseSubmitData } from "@/shared/lib/form";

import {
  createSupplierServiceSubmitSchema,
  type CreateSupplierServiceSubmitData,
} from "./schema";

export interface CreateSupplierServiceFormValues {
  name: string;
  alternativeName: string;
  serviceTypeId: string;
  serviceTypeName: string;
  locationId: string;
  fromLocationId: string;
  toLocationId: string;
  description: string;
}

const defaultValues: CreateSupplierServiceFormValues = {
  name: "",
  alternativeName: "",
  serviceTypeId: "",
  serviceTypeName: "",
  locationId: "",
  fromLocationId: "",
  toLocationId: "",
  description: "",
};

export function useCreateSupplierServiceForm(
  onSubmit: (data: CreateSupplierServiceSubmitData) => void,
  onSchemaError?: (message: string) => void
) {
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = safeParseSubmitData(
        createSupplierServiceSubmitSchema,
        value
      );
      if (!result.success) {
        onSchemaError?.(result.message);
        return;
      }
      onSubmit(result.data);
    },
  });

  return { form };
}
