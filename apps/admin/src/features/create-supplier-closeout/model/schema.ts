import { i18n } from "@sol/i18n";
import { z } from "zod";

import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

export const SUPPLIER_CLOSEOUT_SCOPES = ["supplier", "service"] as const;
export type SupplierCloseoutScope = (typeof SUPPLIER_CLOSEOUT_SCOPES)[number];

export function createSupplierCloseoutSubmitSchema() {
  return z
    .object({
      scope: z.enum(SUPPLIER_CLOSEOUT_SCOPES),
      travelDateFrom: z
        .string()
        .min(
          1,
          VALIDATION_MESSAGES.required(i18n.t("labels.from", { ns: "admin" }))
        ),
      travelDateTo: z
        .string()
        .min(
          1,
          VALIDATION_MESSAGES.required(i18n.t("labels.to", { ns: "admin" }))
        ),
      serviceId: z.string(),
      serviceOptionId: z.string(),
      reason: z.string(),
    })
    .refine(
      (data) =>
        !data.travelDateFrom ||
        !data.travelDateTo ||
        data.travelDateFrom <= data.travelDateTo,
      {
        message: i18n.t("validation.travelDateFromBeforeTo", { ns: "admin" }),
        path: ["travelDateFrom"],
      }
    )
    .refine((data) => data.scope === "supplier" || !!data.serviceId, {
      message: i18n.t("validation.serviceRequiredWhenNotSupplier", {
        ns: "admin",
      }),
      path: ["serviceId"],
    })
    .transform((data) => ({
      travelDateFrom: data.travelDateFrom,
      travelDateTo: data.travelDateTo,
      serviceId: data.scope === "supplier" ? null : data.serviceId || null,
      serviceOptionId:
        data.scope === "supplier" ? null : data.serviceOptionId || null,
      reason: data.reason.trim() || null,
    }));
}

export type CreateSupplierCloseoutSubmitData = z.output<
  ReturnType<typeof createSupplierCloseoutSubmitSchema>
>;
