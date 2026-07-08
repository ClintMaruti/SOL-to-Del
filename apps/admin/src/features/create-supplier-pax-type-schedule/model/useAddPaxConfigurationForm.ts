import { useForm } from "@tanstack/react-form";
import { useMemo } from "react";

import { safeParseSubmitData } from "@/shared/lib/form";

import {
  buildAddPaxConfigurationSubmitSchema,
  zodErrorToSupplierPaxValidationResult,
} from "./validation";
import type {
  SupplierPaxTypesValidationResult,
  SupplierPaxValidationMessages,
} from "./validation";
import {
  createDefaultAddPaxConfigurationValues,
  type AddPaxConfigurationFormValues,
} from "./types";

export function useAddPaxConfigurationForm({
  messages,
  onSubmit,
  onValidationError,
}: {
  messages: SupplierPaxValidationMessages;
  onSubmit: (values: AddPaxConfigurationFormValues) => void;
  onValidationError: (
    result: SupplierPaxTypesValidationResult | undefined
  ) => void;
}) {
  const schema = useMemo(
    () => buildAddPaxConfigurationSubmitSchema(messages),
    [messages]
  );

  const form = useForm({
    defaultValues: createDefaultAddPaxConfigurationValues(),
    onSubmit: ({ value }) => {
      const result = safeParseSubmitData(schema, value);
      if (!result.success) {
        onValidationError(
          zodErrorToSupplierPaxValidationResult(result.error, value)
        );
        return;
      }

      onValidationError(undefined);
      onSubmit(result.data);
    },
  });

  return { form };
}
