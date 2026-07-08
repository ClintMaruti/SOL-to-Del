import { z } from "zod";

import { isValidGuid } from "@/entities/destination/lib/destination-utils";
import type { CreateSupplierFormData } from "./types";
import { emailSchema, postalCodeSchema } from "@/shared/lib/validation";
import { isOptionalValidUrl } from "@/shared/lib/validation/url";
import { tAdmin } from "@/shared/ui/form";

const optionalDateString = z
  .string()
  .trim()
  .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), {
    message: tAdmin("validation.enterValidDate"),
  });

export const paymentTermEntrySchema = z
  .object({
    id: z.string().optional(),
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
    travelDatesFrom: optionalDateString,
    travelDatesTo: optionalDateString,
    depositPercent: z
      .number({
        error: tAdmin("validation.mustBeBetween", { min: 0, max: 100 }),
      })
      .int()
      .min(0, tAdmin("validation.mustBeBetween", { min: 0, max: 100 }))
      .max(100, tAdmin("validation.mustBeBetween", { min: 0, max: 100 }))
      .default(20),
    balanceDueDays: z
      .number()
      .int()
      .min(0, tAdmin("validation.mustBeNonNegativeInteger"))
      .default(60),
    taxCode: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const from = data.travelDatesFrom?.trim();
    const to = data.travelDatesTo?.trim();
    if (!from || !to) return;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()))
      return;
    if (fromDate > toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tAdmin("validation.dateMustBeBeforeOrEqual", {
          field: tAdmin("labels.travelDatesTo"),
        }),
        path: ["travelDatesFrom"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tAdmin("validation.dateMustBeAfterOrEqual", {
          field: tAdmin("labels.travelDatesFrom"),
        }),
        path: ["travelDatesTo"],
      });
    }
  });

const nullableNumber = z
  .union([z.number(), z.null(), z.string()])
  .transform((v) => {
    if (v === null || v === "") return null;
    if (typeof v === "number") return Number.isNaN(v) ? null : v;
    const n = parseFloat(String(v).trim());
    return String(v).trim() === "" || Number.isNaN(n) ? null : n;
  });

/** Name: empty allowed for inactive draft; otherwise 3–64 chars. */
const supplierDraftNameField = z
  .string()
  .trim()
  .max(
    64,
    tAdmin("validation.fieldMaxLength", {
      field: tAdmin("labels.name"),
      max: 64,
    })
  )
  .refine((v) => v === "" || v.length >= 3, {
    message: tAdmin("validation.fieldMinLengthContain", {
      field: tAdmin("labels.name"),
      min: 3,
    }),
  });

const supplierDraftHeadOfficeField = z.string().trim();

const supplierDraftServiceTypeField = z.string().trim();

const supplierDraftTypeField = z
  .string()
  .trim()
  .max(
    64,
    tAdmin("validation.fieldMaxLength", {
      field: tAdmin("labels.type"),
      max: 64,
    })
  );

const supplierDraftEmailField = z.union([
  z.literal(""),
  z.string().trim().min(1).pipe(emailSchema(64)),
]);

const supplierDraftCountryIdField = z.string().trim();

const supplierDraftLocationIdField = z
  .union([z.string(), z.null()])
  .transform((v) => (v ?? "").trim())
  .pipe(
    z.union([
      z.literal(""),
      z.string().refine((id) => isValidGuid(id), {
        message: tAdmin("validation.selectLocationFromList"),
      }),
    ])
  );

const supplierDraftXeroIdField = z
  .string()
  .trim()
  .max(
    100,
    tAdmin("validation.fieldMaxLength", {
      field: tAdmin("labels.xeroId"),
      max: 100,
    })
  );

export type SupplierSaveRequiredFields = Pick<
  CreateSupplierFormData,
  "name" | "headOfficeId" | "serviceTypeId"
>;

/**
 * Required on every save (inactive draft or active).
 */
export function addSupplierRequiredSaveComplianceIssues(
  data: SupplierSaveRequiredFields,
  ctx: z.RefinementCtx
): void {
  const name = data.name.trim();
  if (!name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", { field: tAdmin("labels.name") }),
      path: ["name"],
    });
  } else if (name.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.fieldMinLengthContain", {
        field: tAdmin("labels.name"),
        min: 3,
      }),
      path: ["name"],
    });
  }

  if (!data.headOfficeId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", {
        field: tAdmin("labels.headOffice"),
      }),
      path: ["headOfficeId"],
    });
  }

  if (!data.serviceTypeId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", {
        field: tAdmin("labels.primaryServiceType"),
      }),
      path: ["serviceTypeId"],
    });
  }
}

export type SupplierActivationExtraFields = Pick<
  CreateSupplierFormData,
  "type" | "countryId" | "locationId" | "email" | "xeroId"
>;

/**
 * Required only when activating (toggle or save with isActive true).
 */
export function addSupplierActivationExtraComplianceIssues(
  data: SupplierActivationExtraFields,
  ctx: z.RefinementCtx
): void {
  if (!data.type.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", { field: tAdmin("labels.type") }),
      path: ["type"],
    });
  }

  if (!data.countryId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", {
        field: tAdmin("labels.country"),
      }),
      path: ["countryId"],
    });
  }

  const locationTrimmed = (data.locationId ?? "").trim();
  if (!locationTrimmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", {
        field: tAdmin("labels.location"),
      }),
      path: ["locationId"],
    });
  } else if (!isValidGuid(locationTrimmed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.selectLocationFromList"),
      path: ["locationId"],
    });
  }

  const emailTrimmed = data.email.trim();
  if (!emailTrimmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", { field: tAdmin("labels.email") }),
      path: ["email"],
    });
  } else {
    const emailResult = z
      .string()
      .trim()
      .pipe(emailSchema(64))
      .safeParse(data.email);
    if (!emailResult.success) {
      const first = emailResult.error.issues[0];
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: first?.message ?? tAdmin("validation.invalidEmail"),
        path: ["email"],
      });
    }
  }

  if (!data.xeroId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tAdmin("validation.required", {
        field: tAdmin("labels.xeroId"),
      }),
      path: ["xeroId"],
    });
  }
}

const supplierActivationExtraFieldsObject = z
  .object({
    type: z.string(),
    countryId: z.string(),
    locationId: z.union([z.string(), z.null()]),
    email: z.string(),
    xeroId: z.string(),
  })
  .superRefine((d, ctx) => {
    addSupplierActivationExtraComplianceIssues(
      {
        type: d.type,
        countryId: d.countryId,
        locationId: d.locationId,
        email: d.email,
        xeroId: d.xeroId,
      },
      ctx
    );
  });

/**
 * Validates activation fields (type, country, location, email, Xero ID) before toggling Active.
 */
export function safeParseSupplierActivationFields(
  values: SupplierActivationExtraFields
) {
  return supplierActivationExtraFieldsObject.safeParse({
    type: values.type,
    countryId: values.countryId,
    locationId: values.locationId,
    email: values.email,
    xeroId: values.xeroId,
  });
}

export const supplierSubmitSchema = z
  .object({
    // General Information
    name: supplierDraftNameField,
    headOfficeId: supplierDraftHeadOfficeField,
    code: z.string().trim(),
    additionalName: z
      .string()
      .trim()
      .refine((v) => !v || v.length >= 3, {
        message: tAdmin("validation.fieldMinLengthContain", {
          field: tAdmin("labels.name"),
          min: 3,
        }),
      })
      .refine((v) => v.length <= 64, {
        message: tAdmin("validation.fieldMaxLength", {
          field: tAdmin("labels.name"),
          max: 64,
        }),
      }),
    starRating: z
      .number()
      .int()
      .min(0, tAdmin("validation.starRatingRange"))
      .max(5, tAdmin("validation.starRatingRange"))
      .default(0),
    serviceTypeId: supplierDraftServiceTypeField,
    type: supplierDraftTypeField,
    preferredSupplier: z.boolean().default(false),

    // Contacts
    email: supplierDraftEmailField,
    phone: z.string().trim(),
    additionalEmail: z.union([
      z.literal(""),
      z.string().trim().min(1).pipe(emailSchema(64)),
    ]),
    secondAdditionalEmail: z.union([
      z.literal(""),
      z.string().trim().min(1).pipe(emailSchema(64)),
    ]),
    website: z
      .string()
      .trim()
      .max(
        64,
        tAdmin("validation.fieldMaxLength", {
          field: tAdmin("labels.website"),
          max: 64,
        })
      )
      .refine((s) => !s.trim() || isOptionalValidUrl(s), {
        message: tAdmin("validation.mustBeValidUrl"),
      }),
    liveAvailabilityCheck: z.string().trim(),
    otherCommunicationChannels: z.string().trim(),

    // Address & Location (catalog Country row id)
    countryId: supplierDraftCountryIdField,
    city: z
      .string()
      .trim()
      .max(
        64,
        tAdmin("validation.fieldMaxLength", {
          field: tAdmin("labels.city"),
          max: 64,
        })
      ),
    postalCode: postalCodeSchema(),
    streetAddress: z
      .string()
      .trim()
      .max(
        64,
        tAdmin("validation.fieldMaxLength", {
          field: tAdmin("labels.streetAddress"),
          max: 64,
        })
      ),
    poBox: z
      .string()
      .trim()
      .max(
        50,
        tAdmin("validation.fieldMaxLength", {
          field: tAdmin("labels.poBox"),
          max: 50,
        })
      ),
    locationId: supplierDraftLocationIdField,
    latitude: nullableNumber,
    longitude: nullableNumber,
    closestAirstrip: z.string().trim(),
    airstripLatitude: z.number(),
    airstripLongitude: z.number(),

    // General Policy
    checkIn: z.string().trim(),
    checkOut: z.string().trim(),
    pickUp: z.string().trim(),
    dropOff: z.string().trim(),

    xeroId: supplierDraftXeroIdField,

    paymentTerms: z
      .array(paymentTermEntrySchema)
      .min(1, { error: tAdmin("validation.atLeastOnePaymentTerm") }),
    taxCode: z.string().trim().optional().default("Standard"),

    visibilityForAgentZone: z.boolean(),
    agentZoneId: z.string().trim(),

    /** New suppliers default inactive; activation fields validated only when true. */
    isActive: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    addSupplierRequiredSaveComplianceIssues(
      {
        name: data.name,
        headOfficeId: data.headOfficeId,
        serviceTypeId: data.serviceTypeId,
      },
      ctx
    );

    if (data.visibilityForAgentZone && !data.agentZoneId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tAdmin("validation.agentZoneIdRequired"),
        path: ["agentZoneId"],
      });
    }

    if (data.isActive) {
      addSupplierActivationExtraComplianceIssues(
        {
          type: data.type,
          countryId: data.countryId,
          locationId: data.locationId,
          email: data.email,
          xeroId: data.xeroId,
        },
        ctx
      );
    }
  });

export type SupplierSubmitData = z.output<typeof supplierSubmitSchema>;
