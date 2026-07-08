import { useForm } from "@tanstack/react-form";

import type { DestinationType } from "@/entities/destination/model/types";
import { safeParseSubmitData } from "@/shared/lib/form";

import {
  createDestinationSubmitSchema,
  type CreateDestinationSubmitData,
} from "./schema";

export interface CreateDestinationFormValues {
  type: DestinationType;
  name: string;
  parentId: string;
  iataCode: string; // IATA code - only for Airport type
  destinationCode: string; // Destination code - hidden for Airport type
  latitude: string;
  longitude: string;
  isPreferred: boolean;
}

const defaultValues: CreateDestinationFormValues = {
  type: "Country",
  name: "",
  parentId: "",
  iataCode: "",
  destinationCode: "",
  latitude: "",
  longitude: "",
  isPreferred: false,
};

/**
 * Creates a TanStack Form instance for the Create Destination form.
 *
 * - Field-level UI validation is handled by built-in TanStack Form validators
 *   defined on each `<FormField>` / `<form.Field>` in the UI layer.
 * - Submit-time data validation and transformation is handled by the Zod schema,
 *   which parses raw form strings into the typed API payload.
 */
export function useCreateDestinationForm(
  onSubmit: (data: CreateDestinationSubmitData) => void,
  onSchemaError?: (message: string) => void
) {
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = safeParseSubmitData(createDestinationSubmitSchema, value);
      if (!result.success) {
        onSchemaError?.(result.message);
        return;
      }
      onSubmit(result.data);
    },
  });

  return { form };
}
