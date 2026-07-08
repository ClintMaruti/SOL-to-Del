import { useForm } from "@tanstack/react-form";
import { useMemo } from "react";

import { safeParseSubmitData } from "@/shared/lib/form";

import {
  createSupplierCloseoutSubmitSchema,
  type CreateSupplierCloseoutSubmitData,
  type SupplierCloseoutScope,
} from "./schema";

export interface CreateSupplierCloseoutFormValues {
  scope: SupplierCloseoutScope;
  travelDateFrom: string;
  travelDateTo: string;
  serviceId: string;
  serviceOptionId: string;
  reason: string;
}

const defaultValues: CreateSupplierCloseoutFormValues = {
  scope: "supplier",
  travelDateFrom: "",
  travelDateTo: "",
  serviceId: "",
  serviceOptionId: "",
  reason: "",
};

export function useCreateSupplierCloseoutForm(
  onSubmit: (data: CreateSupplierCloseoutSubmitData) => void,
  onSchemaError?: (message: string) => void
) {
  const schema = useMemo(() => createSupplierCloseoutSubmitSchema(), []);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = safeParseSubmitData(schema, value);
      if (!result.success) {
        onSchemaError?.(result.message);
        return;
      }
      onSubmit(result.data);
    },
  });

  return { form };
}
