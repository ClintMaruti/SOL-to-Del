import { i18n } from "@sol/i18n";
import { z } from "zod";

import type { ServiceTypeValue } from "@/entities/supplier-services";
import {
  tAdmin,
  VALIDATION_MESSAGES,
} from "@/shared/ui/form/validation-messages";

/** Types that show a single "Location" dropdown */
const LOCATION_TYPES: ServiceTypeValue[] = ["accommodation", "fee", "other"];
/** Types that show "From" / "To" dropdowns */
const FROM_TO_TYPES: ServiceTypeValue[] = [
  "flight",
  "transportation",
  "activity",
];
/** Types where both "From" and "To" are required */
const FROM_TO_REQUIRED_TYPES: ServiceTypeValue[] = ["flight"];

export const hasLocationField = (type: string) =>
  LOCATION_TYPES.includes(type as ServiceTypeValue);

export const hasFromToFields = (type: string) =>
  FROM_TO_TYPES.includes(type as ServiceTypeValue);

export const isToFieldRequired = (type: string) =>
  FROM_TO_REQUIRED_TYPES.includes(type as ServiceTypeValue);

export const createSupplierServiceSubmitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .superRefine((val, ctx) => {
        if (val.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: VALIDATION_MESSAGES.required(
              i18n.t("labels.serviceName", { ns: "admin" })
            ),
          });
        } else if (val.length < 3) {
          ctx.addIssue({
            code: "custom",
            message: tAdmin("validation.fieldMinLength", {
              field: tAdmin("labels.serviceName"),
              min: 3,
            }),
          });
        } else if (val.length > 64) {
          ctx.addIssue({
            code: "custom",
            message: tAdmin("validation.fieldMaxLength", {
              field: tAdmin("labels.serviceName"),
              max: 64,
            }),
          });
        }
      }),
    alternativeName: z.string(),
    serviceTypeId: z
      .string()
      .min(
        1,
        VALIDATION_MESSAGES.required(
          i18n.t("labels.serviceType", { ns: "admin" })
        )
      ),
    serviceTypeName: z.string(),
    locationId: z.string(),
    fromLocationId: z.string(),
    toLocationId: z.string(),
    description: z.string(),
  })
  .transform((data) => ({
    name: data.name,
    alternativeName: data.alternativeName.trim() || undefined,
    serviceTypeId: data.serviceTypeId,
    locationId: hasLocationField(data.serviceTypeName)
      ? data.locationId || undefined
      : undefined,
    fromLocationId: hasFromToFields(data.serviceTypeName)
      ? data.fromLocationId || undefined
      : undefined,
    toLocationId: hasFromToFields(data.serviceTypeName)
      ? data.toLocationId || undefined
      : undefined,
    description: data.description.trim() || undefined,
  }));

export type CreateSupplierServiceSubmitData = z.output<
  typeof createSupplierServiceSubmitSchema
>;
