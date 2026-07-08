import { z } from "zod";

import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

export interface CreateExtraFormValues {
  title: string;
  serviceIds: string[];
  description: string;
}

export const createExtraDefaultValues: CreateExtraFormValues = {
  title: "",
  serviceIds: [],
  description: "",
};

export const createExtraSubmitSchema = z.object({
  title: z.string().superRefine((val, ctx) => {
    const trimmed = val.trim();
    if (trimmed.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: VALIDATION_MESSAGES.required("Title"),
      });
    }
  }),
  /** Optional on supplier-level create (BR-3). */
  serviceIds: z.array(z.string()).optional().default([]),
  description: z.string(),
});

export interface CreateExtraSubmitPayload {
  title: string;
  serviceIds?: string[];
  description: string | null;
}

export function toCreateExtraPayload(
  values: CreateExtraFormValues
): CreateExtraSubmitPayload {
  const title = values.title.trim();
  const description = values.description.trim();
  return {
    title,
    serviceIds: values.serviceIds.map((x) => x.trim()).filter(Boolean),
    description: description.length === 0 ? null : description,
  };
}
