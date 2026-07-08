import { i18n } from "@sol/i18n";
import { z } from "zod";

/**
 * Zod schema for create agency group form submission.
 * Parses form values (CreateAgencyGroupFormData shape) into the API request body (CreateAgencyGroupRequest).
 */
export const createAgencyGroupSubmitSchema = z.object({
  name: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      const field = i18n.t("labels.groupName", { ns: "admin" });
      if (val.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("validation.required", { ns: "admin", field }),
        });
      } else if (val.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("validation.fieldCannotBeLessThan", {
            ns: "admin",
            field,
            min: 3,
          }),
        });
      } else if (val.length > 64) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("validation.fieldMaxLength", {
            ns: "admin",
            field,
            max: 64,
          }),
        });
      }
    }),
  description: z
    .string()
    .trim()
    .max(
      1000,
      i18n.t("validation.descriptionMaxLength", { ns: "admin", max: 1000 })
    ),
  agencies: z.array(z.string().trim()).optional(),
});

export type CreateAgencyGroupSubmitData = z.output<
  typeof createAgencyGroupSubmitSchema
>;
