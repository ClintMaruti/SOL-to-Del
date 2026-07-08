import { i18n } from "@sol/i18n";
import { z } from "zod";

import {
  tAdmin,
  VALIDATION_MESSAGES,
} from "@/shared/ui/form/validation-messages";

import { isValid12HourTime } from "./is12HourTime";
import { OPERATING_DAY_COUNT } from "./operating-days";

export const optionFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .superRefine((val, ctx) => {
        if (val.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: VALIDATION_MESSAGES.required(
              i18n.t("labels.optionTitle", { ns: "admin" })
            ),
          });
        } else if (val.length < 2) {
          ctx.addIssue({
            code: "custom",
            message: tAdmin("validation.fieldMinLength", {
              field: tAdmin("labels.optionTitle"),
              min: 2,
            }),
          });
        } else if (val.length > 200) {
          ctx.addIssue({
            code: "custom",
            message: tAdmin("validation.fieldMaxLength", {
              field: tAdmin("labels.optionTitle"),
              max: 200,
            }),
          });
        }
      }),
    includes: z.string(),
    excludes: z.string(),
    contractId: z.string().nullable(),
    isActive: z.boolean().optional(),
    timeFrom: z.string(),
    timeTo: z.string(),
    flightNumber: z.string(),
    operatingDaySelected: z.array(z.boolean()).length(OPERATING_DAY_COUNT),
  })
  .superRefine((data, ctx) => {
    const timeFrom = data.timeFrom.trim();
    const timeTo = data.timeTo.trim();
    const hasFrom = Boolean(timeFrom);
    const hasTo = Boolean(timeTo);

    if (hasFrom !== hasTo) {
      const msg = VALIDATION_MESSAGES.timeFromTimeToPair();
      ctx.addIssue({
        code: "custom",
        message: msg,
        path: ["timeFrom"],
      });
      ctx.addIssue({
        code: "custom",
        message: msg,
        path: ["timeTo"],
      });
      return;
    }

    if (timeFrom && !isValid12HourTime(timeFrom)) {
      ctx.addIssue({
        code: "custom",
        message: VALIDATION_MESSAGES.time12HourFormat(
          i18n.t("labels.timeFrom", { ns: "admin" })
        ),
        path: ["timeFrom"],
      });
    }
    if (timeTo && !isValid12HourTime(timeTo)) {
      ctx.addIssue({
        code: "custom",
        message: VALIDATION_MESSAGES.time12HourFormat(
          i18n.t("labels.timeTo", { ns: "admin" })
        ),
        path: ["timeTo"],
      });
    }
  })
  .transform((data) => ({
    title: data.title,
    includes: data.includes.trim() || undefined,
    excludes: data.excludes.trim() || undefined,
    contractId: data.contractId || null,
    isActive: data.isActive ?? false,
    timeFrom: data.timeFrom,
    timeTo: data.timeTo,
    flightNumber: data.flightNumber.trim(),
    operatingDaySelected: data.operatingDaySelected,
  }));

export type OptionFormSubmitData = z.output<typeof optionFormSchema>;
