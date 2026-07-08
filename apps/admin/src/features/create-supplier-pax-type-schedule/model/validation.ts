import { z, type ZodError, type ZodIssue } from "zod";

import type { PaxType } from "@/entities/supplier-pax-type-schedule";

import type { AddPaxConfigurationFormValues } from "./types";

export const SUPPLIER_PAX_VALIDATION_MESSAGES = {
  validFromRequired: "Valid From is required.",
  activeAgeRangeRequired: "Age range is required for active Pax Types.",
  ageFromLessThanAgeTo: "Age From must be less than Age To.",
  rangesMustNotOverlap: "Age ranges must not overlap across active Pax Types.",
  adultCannotBeDeactivated: "Adult cannot be deactivated.",
  adultMustCoverHighestAgeBoundary:
    "Adult must cover the highest age boundary.",
  endDateMustBeOnOrAfterStart: "End date must be on or after start date.",
} as const;

export type SupplierPaxValidationMessages = Record<
  keyof typeof SUPPLIER_PAX_VALIDATION_MESSAGES,
  string
>;

export type SupplierPaxTypeFieldErrors = Partial<
  Record<PaxType, Partial<Record<"ageFrom" | "ageTo" | "isActive", string>>>
>;

export interface SupplierPaxTypesValidationResult {
  isValid: boolean;
  validFrom?: string;
  validTo?: string;
  paxTypes: SupplierPaxTypeFieldErrors;
  form: string[];
}

export function dateRangesOverlap(
  fromA: string,
  toA: string | null | undefined,
  fromB: string,
  toB: string | null | undefined
) {
  const normalizedToA = toA || "9999-12-31";
  const normalizedToB = toB || "9999-12-31";
  return fromA <= normalizedToB && normalizedToA >= fromB;
}

export function ageRangesOverlap(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number
) {
  return fromA <= toB && toA >= fromB;
}

const paxTypeSchema = z.enum(["Adult", "Child", "Infant", "Teen"]);

const supplierPaxTypeFormRowSchema = z.object({
  paxType: paxTypeSchema,
  name: paxTypeSchema,
  ageFrom: z.string(),
  ageTo: z.string(),
  isActive: z.boolean(),
});

function toNullableInteger(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function addRowError(
  errors: SupplierPaxTypeFieldErrors,
  paxType: PaxType,
  field: "ageFrom" | "ageTo" | "isActive",
  message: string
) {
  errors[paxType] = {
    ...errors[paxType],
    [field]: message,
  };
}

function pushUnique(messages: string[], message: string) {
  if (!messages.includes(message)) {
    messages.push(message);
  }
}

function getPaxTypeByIssue(
  values: AddPaxConfigurationFormValues,
  issue: ZodIssue
): PaxType | undefined {
  const [root, index] = issue.path;
  if (root !== "paxTypes" || typeof index !== "number") {
    return undefined;
  }

  return values.paxTypes[index]?.paxType;
}

function getFieldByIssue(issue: ZodIssue) {
  const field = issue.path[2];
  if (field === "ageFrom" || field === "ageTo" || field === "isActive") {
    return field;
  }

  return undefined;
}

function addSchemaIssue(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  message: string
) {
  ctx.addIssue({
    code: "custom",
    path,
    message,
  });
}

export function buildAddPaxConfigurationSubmitSchema(
  messages: SupplierPaxValidationMessages = SUPPLIER_PAX_VALIDATION_MESSAGES
): z.ZodType<AddPaxConfigurationFormValues> {
  return z
    .object({
      validFrom: z.string(),
      validTo: z.string(),
      paxTypes: z.array(supplierPaxTypeFormRowSchema),
    })
    .superRefine((values, ctx) => {
      if (!values.validFrom) {
        addSchemaIssue(ctx, ["validFrom"], messages.validFromRequired);
      }

      if (
        values.validFrom &&
        values.validTo &&
        values.validTo < values.validFrom
      ) {
        addSchemaIssue(ctx, ["validTo"], messages.endDateMustBeOnOrAfterStart);
      }

      const adultIndex = values.paxTypes.findIndex(
        (row) => row.paxType === "Adult"
      );
      const adult = adultIndex >= 0 ? values.paxTypes[adultIndex] : undefined;

      if (!adult?.isActive) {
        addSchemaIssue(
          ctx,
          ["paxTypes", Math.max(adultIndex, 0), "isActive"],
          messages.adultCannotBeDeactivated
        );
      }

      const activeRanges: Array<{
        index: number;
        paxType: PaxType;
        ageFromNumber: number;
        ageToNumber: number;
      }> = [];

      values.paxTypes.forEach((row, index) => {
        const ageFrom = toNullableInteger(row.ageFrom);
        const ageTo = toNullableInteger(row.ageTo);
        const isActive = row.paxType === "Adult" || row.isActive;

        if (!isActive) return;

        if (ageFrom === null || ageTo === null) {
          if (ageFrom === null) {
            addSchemaIssue(
              ctx,
              ["paxTypes", index, "ageFrom"],
              messages.activeAgeRangeRequired
            );
          }
          if (ageTo === null) {
            addSchemaIssue(
              ctx,
              ["paxTypes", index, "ageTo"],
              messages.activeAgeRangeRequired
            );
          }
          return;
        }

        if (ageFrom >= ageTo) {
          addSchemaIssue(
            ctx,
            ["paxTypes", index, "ageFrom"],
            messages.ageFromLessThanAgeTo
          );
          addSchemaIssue(
            ctx,
            ["paxTypes", index, "ageTo"],
            messages.ageFromLessThanAgeTo
          );
          return;
        }

        activeRanges.push({
          index,
          paxType: row.paxType,
          ageFromNumber: ageFrom,
          ageToNumber: ageTo,
        });
      });

      for (let i = 0; i < activeRanges.length; i += 1) {
        for (let j = i + 1; j < activeRanges.length; j += 1) {
          const current = activeRanges[i];
          const candidate = activeRanges[j];
          if (
            !ageRangesOverlap(
              current.ageFromNumber,
              current.ageToNumber,
              candidate.ageFromNumber,
              candidate.ageToNumber
            )
          ) {
            continue;
          }

          addSchemaIssue(
            ctx,
            ["paxTypes", current.index, "ageFrom"],
            messages.rangesMustNotOverlap
          );
          addSchemaIssue(
            ctx,
            ["paxTypes", current.index, "ageTo"],
            messages.rangesMustNotOverlap
          );
          addSchemaIssue(
            ctx,
            ["paxTypes", candidate.index, "ageFrom"],
            messages.rangesMustNotOverlap
          );
          addSchemaIssue(
            ctx,
            ["paxTypes", candidate.index, "ageTo"],
            messages.rangesMustNotOverlap
          );
        }
      }

      const adultRange = activeRanges.find((row) => row.paxType === "Adult");
      if (adultRange) {
        const highestNonAdultAgeTo = Math.max(
          ...activeRanges
            .filter((row) => row.paxType !== "Adult")
            .map((row) => row.ageToNumber),
          Number.NEGATIVE_INFINITY
        );
        if (adultRange.ageToNumber < highestNonAdultAgeTo) {
          addSchemaIssue(
            ctx,
            ["paxTypes", adultRange.index, "ageTo"],
            messages.adultMustCoverHighestAgeBoundary
          );
        }
      }
    });
}

export function zodErrorToSupplierPaxValidationResult(
  error: ZodError,
  values: AddPaxConfigurationFormValues
): SupplierPaxTypesValidationResult {
  const result: SupplierPaxTypesValidationResult = {
    isValid: false,
    paxTypes: {},
    form: [],
  };

  for (const issue of error.issues) {
    const [root] = issue.path;
    if (root === "validFrom") {
      result.validFrom = issue.message;
    } else if (root === "validTo") {
      result.validTo = issue.message;
    } else {
      const paxType = getPaxTypeByIssue(values, issue);
      const field = getFieldByIssue(issue);
      if (paxType && field) {
        addRowError(result.paxTypes, paxType, field, issue.message);
      }
    }

    pushUnique(result.form, issue.message);
  }

  return result;
}

export function validateSupplierPaxTypes(
  values: AddPaxConfigurationFormValues,
  messages: SupplierPaxValidationMessages = SUPPLIER_PAX_VALIDATION_MESSAGES
): SupplierPaxTypesValidationResult {
  const result =
    buildAddPaxConfigurationSubmitSchema(messages).safeParse(values);

  if (!result.success) {
    return zodErrorToSupplierPaxValidationResult(result.error, values);
  }

  return {
    isValid: true,
    paxTypes: {},
    form: [],
  };
}
