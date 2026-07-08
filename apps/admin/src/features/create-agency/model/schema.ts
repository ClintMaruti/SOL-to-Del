import { i18n } from "@sol/i18n";
import { z } from "zod";

import { postalCodeSchema } from "@/shared/lib/validation";

/** Optional string that must be a valid URL when non-empty. */
const optionalUrl = z
  .string()
  .trim()
  .max(250)
  .refine(
    (s) => s === "" || isValidUrl(s),
    i18n.t("validation.mustBeValidUrl", { ns: "admin" })
  );

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/** Decimal 0–100 (precision 5,2: max 999.99). */
export const depositPercentSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (s) => {
      if (!s) return true;
      const n = Number(s);
      if (!Number.isFinite(n)) return false;
      if (n < 0 || n > 100) return false;
      const parts = s.trim().split(".");
      if (parts.length > 2) return false;
      if (parts[1] && parts[1].length > 2) return false;
      return true;
    },
    {
      message: i18n.t("validation.mustBeBetween", {
        ns: "admin",
        min: 0,
        max: 100,
      }),
    }
  )
  .default("20");

/** Integer ≥ 0. */
export const balanceDueDaysSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (s) => {
      if (!s) return true;
      const n = parseInt(s, 10);
      return Number.isInteger(n) && n >= 0;
    },
    { message: i18n.t("validation.mustBeZeroOrGreater", { ns: "admin" }) }
  )
  .default("60");

/**
 * Zod schema for agency form submission (Create POST / Update PUT).
 * Trims string fields and enforces API constraints.
 */
export const agencySubmitSchema = z
  .object({
    // General — API: name, sourceMarketId, iataAgencyCode
    agencyName: z
      .string()
      .trim()
      .superRefine((val, ctx) => {
        const field = i18n.t("labels.agencyName", { ns: "admin" });
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
    sourceMarket: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.sourceMarket", { ns: "admin" }),
        })
      ),
    iataCode: z
      .string()
      .trim()
      .max(
        15,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.iataCode", { ns: "admin" }),
          max: 15,
        })
      )
      .refine(
        (s) => !/\s/.test(s),
        i18n.t("validation.fieldMustNotContainWhitespace", {
          ns: "admin",
          field: i18n.t("labels.iataCode", { ns: "admin" }),
        })
      ),
    agencyGroupIds: z
      .array(z.string().trim().min(1))
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.agencyGroup", { ns: "admin" }),
        })
      )
      .superRefine((ids, ctx) => {
        if (new Set(ids).size !== ids.length) {
          ctx.addIssue({
            code: "custom",
            message: i18n.t("validation.duplicateAgencyGroups", {
              ns: "admin",
            }),
          });
        }
      }),
    assignedSafariPlannerId: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.safariPlannerId", { ns: "admin" }),
        })
      ),
    assignedSafariPlannerName: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.safariPlannerName", { ns: "admin" }),
        })
      ),
    // Contacts & Address
    email: z
      .email({
        error: i18n.t("validation.mustBeValidEmail", { ns: "admin" }),
      })
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.email", { ns: "admin" }),
        })
      )
      .max(
        64,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.email", { ns: "admin" }),
          max: 64,
        })
      ),
    phone: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.phone", { ns: "admin" }),
        })
      )
      .max(
        50,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.phone", { ns: "admin" }),
          max: 50,
        })
      ),
    country: z
      .string()
      .trim()
      .max(
        100,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.country", { ns: "admin" }),
          max: 100,
        })
      ),
    city: z
      .string()
      .trim()
      .max(
        64,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.city", { ns: "admin" }),
          max: 64,
        })
      ),
    postalCode: postalCodeSchema(),
    streetAddress: z
      .string()
      .trim()
      .max(
        64,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.streetAddress", { ns: "admin" }),
          max: 64,
        })
      ),
    website: optionalUrl,
    // Payment terms
    depositPercent: depositPercentSchema,
    balanceDueDays: balanceDueDaysSchema,
    taxCode: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.taxCode", { ns: "admin" }),
        })
      )
      .max(
        50,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.taxCode", { ns: "admin" }),
          max: 50,
        })
      ),
    // Credit terms
    hasCreditTerms: z.boolean(),
    creditTermsNote: z
      .string()
      .trim()
      .max(
        500,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.creditNotes", { ns: "admin" }),
          max: 500,
        })
      ),
    // White label
    needsWhiteLabel: z.boolean(),
    whiteLabelNote: z
      .string()
      .trim()
      .max(
        500,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.whiteLabelingNote", { ns: "admin" }),
          max: 500,
        })
      ),
    // Agent zone
    agentZoneVisible: z.boolean(),
    agentZoneId: z
      .string()
      .trim()
      .max(
        64,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.agentZoneId", { ns: "admin" }),
          max: 64,
        })
      ),
    agencyAffiliations: z
      .string()
      .trim()
      .max(
        500,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.agencyAffiliations", { ns: "admin" }),
          max: 500,
        })
      ),
    kenXeroId: z
      .string()
      .trim()
      .max(
        100,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.kenXeroId", { ns: "admin" }),
          max: 100,
        })
      ),
    rwXeroId: z
      .string()
      .trim()
      .max(
        100,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.rwXeroId", { ns: "admin" }),
          max: 100,
        })
      ),
    tzXeroId: z
      .string()
      .trim()
      .max(
        100,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.tzXeroId", { ns: "admin" }),
          max: 100,
        })
      ),
    znzXeroId: z
      .string()
      .trim()
      .max(
        100,
        i18n.t("validation.fieldMaxLength", {
          ns: "admin",
          field: i18n.t("labels.znzXeroId", { ns: "admin" }),
          max: 100,
        })
      ),
    additionalNotes: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.hasCreditTerms && !data.creditTermsNote.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("validation.creditTermsNoteRequired", {
          ns: "admin",
        }),
        path: ["creditTermsNote"],
      });
    }
    if (data.needsWhiteLabel && !data.whiteLabelNote.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("validation.whiteLabelNoteRequired", {
          ns: "admin",
        }),
        path: ["whiteLabelNote"],
      });
    }
    if (data.agentZoneVisible && !data.agentZoneId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("validation.agentZoneIdRequired", { ns: "admin" }),
        path: ["agentZoneId"],
      });
    }
  });

export type AgencySubmitData = z.output<typeof agencySubmitSchema>;
