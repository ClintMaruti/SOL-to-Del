import { i18n } from "@sol/i18n";
import { z } from "zod";

import { optionalUrlSchema } from "@/shared/lib/validation/url";
import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

export const ANY_AGENCY_GROUP_VALUE = "__ANY_AGENCY_GROUP__";

export const attachContractSubmitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        1,
        VALIDATION_MESSAGES.required(
          i18n.t("labels.contractName", { ns: "admin" })
        )
      ),
    link: optionalUrlSchema(i18n.t("validation.invalidUrl", { ns: "admin" })),
    agencyGroupId: z.string().optional(),
    validFrom: z
      .string()
      .min(
        1,
        VALIDATION_MESSAGES.required(
          i18n.t("labels.validFrom", { ns: "admin" })
        )
      ),
    validTo: z
      .string()
      .min(
        1,
        VALIDATION_MESSAGES.required(i18n.t("labels.validTo", { ns: "admin" }))
      ),
  })
  .refine((data) => data.validTo >= data.validFrom, {
    message: i18n.t("validation.validToMustBeAfterValidFrom", { ns: "admin" }),
    path: ["validTo"],
  })
  .transform((data) => ({
    name: data.name,
    link: data.link || undefined,
    agencyGroupId:
      !data.agencyGroupId || data.agencyGroupId === ANY_AGENCY_GROUP_VALUE
        ? null
        : data.agencyGroupId,
    validFrom: data.validFrom,
    validTo: data.validTo,
  }));

export type AttachContractSubmitData = z.output<
  typeof attachContractSubmitSchema
>;
