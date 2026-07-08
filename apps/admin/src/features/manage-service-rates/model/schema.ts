import { i18n } from "@sol/i18n";
import { z } from "zod";

import type { ChargeTypeApi, TimeUnitApi } from "@/entities/service-rate";

const CHARGE_TYPE_VALUES = ["Person", "Unit"] as const satisfies readonly [
  ChargeTypeApi,
  ChargeTypeApi,
];

const TIME_UNIT_VALUES = [
  "Night",
  "Day",
  "Stay",
  "None",
] as const satisfies readonly [
  TimeUnitApi,
  TimeUnitApi,
  TimeUnitApi,
  TimeUnitApi,
];

export const serviceRateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, i18n.t("validation.rateNameRequired", { ns: "admin" })),
  chargeType: z.enum(CHARGE_TYPE_VALUES, {
    message: i18n.t("validation.chargeTypeRequired", { ns: "admin" }),
  }),
  timeUnit: z.enum(TIME_UNIT_VALUES, {
    message: i18n.t("validation.timeUnitRequired", { ns: "admin" }),
  }),
});

export type ServiceRateFormValues = z.infer<typeof serviceRateFormSchema>;

export const DEFAULT_SERVICE_RATE_FORM: ServiceRateFormValues = {
  name: "",
  chargeType: "Person",
  timeUnit: "Night",
};
