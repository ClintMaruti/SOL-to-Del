import { i18n } from "@sol/i18n";
import { z } from "zod";

import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

export const editSupplierServiceSubmitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        1,
        VALIDATION_MESSAGES.required(
          i18n.t("labels.serviceName", { ns: "admin" })
        )
      ),
    alternativeName: z.string(),
    serviceTypeId: z.string(),
    locationId: z.string(),
    description: z.string(),
    tags: z.string(),
    isActive: z.boolean(),
  })
  .transform((data) => ({
    name: data.name,
    alternativeName: data.alternativeName.trim() || undefined,
    description: data.description.trim() || undefined,
    tags: data.tags.trim(),
    isActive: data.isActive,
  }));

export type EditSupplierServiceSubmitData = z.output<
  typeof editSupplierServiceSubmitSchema
>;
