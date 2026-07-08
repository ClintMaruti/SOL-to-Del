import { z } from "zod";

import {
  COUNTRY_NAMES,
  resolveToIsoOfficialCountryName,
} from "@/shared/lib/countries";
import { phoneRequiredSchema, postalCodeSchema } from "@/shared/lib/validation";
import { tAdmin } from "@/shared/ui/form";

/**
 * Zod schema for supplier head office form submission.
 * Trims string fields; required: name, email, phone.
 * Country must be empty or one of the shared countries list.
 */
export const createSupplierHeadOfficeSubmitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      3,
      tAdmin("validation.fieldMinLength", {
        field: tAdmin("labels.name"),
        min: 3,
      })
    )
    .max(
      64,
      tAdmin("validation.fieldMaxLength", {
        field: tAdmin("labels.name"),
        max: 64,
      })
    ),
  email: z
    .email({
      error: tAdmin("validation.mustBeValidEmail"),
    })
    .trim()
    .min(1, tAdmin("validation.required", { field: tAdmin("labels.email") })),
  phoneNumber: phoneRequiredSchema({
    required: tAdmin("validation.required", { field: tAdmin("labels.phone") }),
    format: tAdmin("validation.invalidPhone"),
  }),
  additionalEmail: z.string().trim(),
  website: z.string().trim(),
  country: z
    .string()
    .trim()
    .transform((v) => {
      if (!v) return "";
      return resolveToIsoOfficialCountryName(v) ?? v;
    })
    .refine((v) => v === "" || COUNTRY_NAMES.includes(v), {
      message: tAdmin("validation.selectCountryFromList"),
    }),
  city: z.string().trim(),
  postalCode: postalCodeSchema(),
  streetAddress: z.string().trim(),
});

export type CreateSupplierHeadOfficeSubmitData = z.output<
  typeof createSupplierHeadOfficeSubmitSchema
>;
