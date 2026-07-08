import { i18n } from "@sol/i18n";
import type { ZodIssue } from "zod";
import { z } from "zod";

import type {
  ChargeTypeApi,
  TimeUnitApi,
} from "@/entities/service-option-rate";

import { getOverlappingTravelKeysAcrossContractedRates } from "./travelDateOverlap";

/** Maps Zod path segments to TanStack Form deep field keys (see rate-plan schema). */
export function zodPathToTanStackDeepKey(path: (string | number)[]): string {
  let s = "";
  for (const seg of path) {
    if (typeof seg === "number") {
      s += `[${seg}]`;
    } else {
      s += s === "" ? String(seg) : `.${String(seg)}`;
    }
  }
  return s;
}

export function zodIssuesToFieldRecord(
  issues: ZodIssue[]
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = zodPathToTanStackDeepKey(issue.path as (string | number)[]);
    if (!key) continue;
    const msg = issue.message;
    fields[key] = fields[key] ? `${fields[key]}; ${msg}` : msg;
  }
  return fields;
}

/** Matches catalog `ChargeTypeApi` literals for form validation. */
const CHARGE_TYPE_VALUES = ["Person", "Unit"] as const satisfies readonly [
  ChargeTypeApi,
  ChargeTypeApi,
];

/** Matches catalog `TimeUnitApi` literals for form validation. */
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

export const travelDateSchema = z.object({
  id: z.string().optional(),
  travelDateFrom: z.string(),
  travelDateTo: z.string(),
  weekdays: z.string().optional(),
});

export const contractedRateDateSchema = z.object({
  travelDates: z
    .array(travelDateSchema)
    .min(1, i18n.t("validation.atLeastOneTravelDate", { ns: "admin" })),
});

export const moneyAmountSchema = z.object({
  currency: z.string().optional(),
  value: z.union([z.number(), z.null()]),
});

/** Net/rack field value while editing (allows empty before save validation). */
export const moneyAmountValueFormSchema = z.union([z.number(), z.null()]);

/** Default priority for new contracted rate rows (matches {@link EMPTY_CONTRACTED_RATE}). */
export const DEFAULT_CONTRACTED_RATE_PRIORITY = 100;

/** GET/API uses `sell: null`; the form always edits an object (matches {@link EMPTY_CONTRACTED_RATE}). */
const sellFormValueSchema = z.object({
  currency: z.string().optional(),
  value: z.number().nullable(),
});

export const contractedRateSchema = z.object({
  id: z.string().optional(),
  /** Stable client-only key for rows without a server id (omitted from API payloads). */
  clientRowKey: z.string().optional(),
  contractId: z.string().optional(),
  rateId: z.string().optional(),
  rack: moneyAmountSchema,
  net: moneyAmountSchema,
  sell: z.preprocess(
    (val: unknown) =>
      val === null || val === undefined
        ? { currency: "USD", value: null }
        : val,
    sellFormValueSchema
  ),
  priority: z.coerce
    .number()
    .int()
    .min(1, i18n.t("validation.priorityMin", { ns: "admin", min: 1 }))
    .max(100, i18n.t("validation.priorityMax", { ns: "admin", max: 100 }))
    .optional()
    .default(DEFAULT_CONTRACTED_RATE_PRIORITY),
  bookingWindowFrom: z.string(),
  bookingWindowTo: z.string(),
  contractedRateDates: z.array(contractedRateDateSchema),
});

export const rateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      1,
      i18n.t("validation.required", {
        ns: "admin",
        field: i18n.t("labels.rateName", { ns: "admin" }),
      })
    )
    .max(
      64,
      i18n.t("validation.fieldMaxLength", {
        ns: "admin",
        field: i18n.t("labels.rateName", { ns: "admin" }),
        max: 64,
      })
    ),
  chargeType: z.enum(CHARGE_TYPE_VALUES),
  timeUnit: z.enum(TIME_UNIT_VALUES),
  version: z.number().optional(),
  contractedRates: z.array(contractedRateSchema),
});

export type RateFormSubmitData = z.output<typeof rateFormSchema>;

export interface RateContractValidity {
  validFrom: string;
  validTo: string;
}

/** Normalized selected contract validity for rate travel-date boundary checks. */
export function contractValidityToBounds(
  contract: RateContractValidity | null | undefined
): RateContractValidity | null {
  const validFrom = contract?.validFrom?.trim();
  const validTo = contract?.validTo?.trim();
  if (validFrom && validTo) {
    return { validFrom, validTo };
  }
  return null;
}

export function travelDateOutsideContractBounds(
  travelDate: { travelDateFrom?: string | null; travelDateTo?: string | null },
  contractBounds: RateContractValidity | null
): boolean {
  if (!contractBounds) return false;
  const from = travelDate.travelDateFrom?.trim() ?? "";
  const to = travelDate.travelDateTo?.trim() ?? "";
  if (!from || !to || !(from < to)) return false;
  return from < contractBounds.validFrom || to > contractBounds.validTo;
}

function refineRateFormSave(
  data: RateFormSubmitData,
  ctx: z.RefinementCtx,
  contractValidity?: RateContractValidity | null
): void {
  if (data.contractedRates.length === 0) {
    return;
  }

  const contractBounds = contractValidityToBounds(contractValidity);
  const outsideContractMsg = i18n.t("validation.travelDatesOutsideContract", {
    ns: "admin",
  });

  data.contractedRates.forEach((cr, crIdx) => {
    const base: (string | number)[] = ["contractedRates", crIdx];

    const hasPriorityValueError =
      !contractedRateSchema.shape.priority.safeParse(Number(cr.priority))
        .success;
    if (hasPriorityValueError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Priority must be a whole number between 1 and 100.",
        path: [...base, "priority"],
      });
    }

    const net = cr.net.value;
    const rack = cr.rack.value;
    if (net == null || !Number.isFinite(net) || net <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Net must be a positive number.",
        path: [...base, "net", "value"],
      });
    }
    if (rack == null || !Number.isFinite(rack) || rack <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rack must be a positive number.",
        path: [...base, "rack", "value"],
      });
    }

    const bwFrom = cr.bookingWindowFrom?.trim() ?? "";
    const bwTo = cr.bookingWindowTo?.trim() ?? "";
    if (bwFrom && bwTo && bwTo <= bwFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Booking window end must be after the start.",
        path: [...base, "bookingWindowTo"],
      });
    }

    cr.contractedRateDates.forEach((date, dIdx) => {
      date.travelDates.forEach((td, tIdx) => {
        const tbase: (string | number)[] = [
          ...base,
          "contractedRateDates",
          dIdx,
          "travelDates",
          tIdx,
        ];
        const from = td.travelDateFrom?.trim() ?? "";
        const to = td.travelDateTo?.trim() ?? "";
        if (!from) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t("validation.travelDateFromRequired", {
              ns: "admin",
            }),
            path: [...tbase, "travelDateFrom"],
          });
        }
        if (!to) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t("validation.travelDateToRequired", {
              ns: "admin",
            }),
            path: [...tbase, "travelDateTo"],
          });
        }
        if (from && to && !(from < to)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t("validation.travelDateFromBeforeTo", {
              ns: "admin",
            }),
            path: [...tbase, "travelDateTo"],
          });
        }
        if (travelDateOutsideContractBounds(td, contractBounds)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: outsideContractMsg,
            path: [...tbase, "travelDateFrom"],
          });
        }
      });
    });
  });

  const overlapMsg = i18n.t(
    "validation.ratePlanTravelDates.overlappingRanges",
    { ns: "admin" }
  );
  for (const key of getOverlappingTravelKeysAcrossContractedRates(
    data.contractedRates
  )) {
    const parts = key.split(":");
    if (parts.length !== 3) continue;
    const overlapCrIdx = Number(parts[0]);
    const dateIndex = Number(parts[1]);
    const travelIndex = Number(parts[2]);
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: overlapMsg,
      path: [
        "contractedRates",
        overlapCrIdx,
        "contractedRateDates",
        dateIndex,
        "travelDates",
        travelIndex,
        "travelDateFrom",
      ],
    });
  }
}

/** Save-time validation: contracted-rate rows are optional; when present, rules mirror the widget table. */
export function createRateFormSaveSchema(
  contractValidity?: RateContractValidity | null
) {
  return rateFormSchema.superRefine((data, ctx) =>
    refineRateFormSave(data, ctx, contractValidity)
  );
}

export const rateFormSaveSchema = createRateFormSaveSchema();

export function validateRateFormSaveToFields(
  value: RateFormSubmitData,
  contractValidity?: RateContractValidity | null
): Record<string, string> {
  const result = createRateFormSaveSchema(contractValidity).safeParse(value);
  if (!result.success) {
    return zodIssuesToFieldRecord(result.error.issues);
  }
  return {};
}

export const ratesFormSchema = z.object({
  rates: z.array(rateFormSchema),
});

export type RatesFormSubmitData = z.output<typeof ratesFormSchema>;
