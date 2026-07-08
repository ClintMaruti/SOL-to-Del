import { useForm } from "@tanstack/react-form";

import { safeParseSubmitData } from "@/shared/lib/form";

import {
  createExtraDefaultValues,
  createExtraSubmitSchema,
  toCreateExtraPayload,
  type CreateExtraSubmitPayload,
} from "./schema";

export function useCreateExtraForm(
  onSubmit: (data: CreateExtraSubmitPayload) => void,
  onSchemaError?: (message: string) => void
) {
  const form = useForm({
    defaultValues: createExtraDefaultValues,
    onSubmit: async ({ value }) => {
      const result = safeParseSubmitData(createExtraSubmitSchema, value);
      if (!result.success) {
        onSchemaError?.(result.message);
        return;
      }
      onSubmit(toCreateExtraPayload(result.data));
    },
  });

  return { form };
}
