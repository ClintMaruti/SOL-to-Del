import { z } from "zod";

import {
  PROMOTION_PAX_CODES,
  PROMOTION_SELECT_ANY_VALUE,
  PROMOTION_TARGET_NIGHTS_TYPES,
} from "@/entities/promotion";
import { tAdmin } from "@/shared/ui/form";

const promotionNameSchema = z
  .string()
  .trim()
  .min(
    3,
    tAdmin("validation.fieldMinLength", {
      field: tAdmin("labels.promotionName"),
      min: 3,
    })
  )
  .max(
    64,
    tAdmin("validation.fieldMaxLength", {
      field: tAdmin("labels.promotionName"),
      max: 64,
    })
  );

const positiveIntegerOrNull = z.number().int().positive().nullable();

const travelDateRangeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  version: z.number().int().positive().nullable().optional(),
});

const bookingWindowSchema = z.object({
  from: z.string(),
  to: z.string(),
});

const bookingWindowRelativeSchema = z.object({
  fromDays: positiveIntegerOrNull,
  toDays: positiveIntegerOrNull,
});

const supplierNightsConditionSchema = z.object({
  id: z.string(),
  type: z.literal("SupplierNights"),
  supplierId: z.string().nullable(),
  serviceId: z.string().nullable(),
  optionText: z.string(),
  minNights: z.number().int().positive().nullable(),
  maxNights: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable().optional(),
});

const suppliersTotalConditionSchema = z.object({
  id: z.string(),
  type: z.literal("SuppliersTotal"),
  minSuppliers: z.number().int().positive().nullable(),
  maxSuppliers: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable().optional(),
});

const nightsTotalConditionSchema = z.object({
  id: z.string(),
  type: z.literal("NightsTotal"),
  minNights: z.number().int().positive().nullable(),
  maxNights: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable().optional(),
});

const paxNumberConditionSchema = z.object({
  id: z.string(),
  type: z.literal("PaxNumber"),
  paxCode: z.enum(PROMOTION_PAX_CODES),
  minPax: z.number().int().positive().nullable(),
  maxPax: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable().optional(),
});

const paxAgeConditionSchema = z.object({
  id: z.string(),
  type: z.literal("PaxAge"),
  paxCode: z.enum(PROMOTION_PAX_CODES),
  minAge: z.number().int().positive().nullable(),
  maxAge: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable().optional(),
});

const discountRowSchema = z.object({
  id: z.string(),
  discountPercent: z.number().min(0).max(100).nullable(),
  paxCode: z.enum(PROMOTION_PAX_CODES),
  paxIndexFrom: z.number().int().positive().nullable(),
  paxIndexTo: z.number().int().positive().nullable(),
  targetNightsType: z.enum(PROMOTION_TARGET_NIGHTS_TYPES),
  nightIndexFrom: z.number().int().positive().nullable(),
  nightIndexTo: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable().optional(),
  actionId: z.string().nullable().optional(),
  actionVersion: z.number().int().positive().nullable().optional(),
});

const discountActionSchema = z.object({
  id: z.string(),
  type: z.literal("DiscountPercentage"),
  rows: z.array(discountRowSchema),
});

const addOnActionSchema = z.object({
  id: z.string(),
  type: z.literal("AddOn"),
  items: z.array(
    z.object({
      id: z.string(),
      serviceTypeId: z.string().nullable().optional(),
      value: z.string(),
      version: z.number().int().positive().nullable().optional(),
      actionId: z.string().nullable().optional(),
      actionVersion: z.number().int().positive().nullable().optional(),
    })
  ),
});

const createPromotionSubmitSchemaBase = z.object({
  version: z.number().int().positive().nullable().optional(),
  name: promotionNameSchema,
  isPartiallySupported: z.boolean(),
  note: z.string(),
  noteId: z.string().nullable().optional(),
  noteVersion: z.number().int().positive().nullable().optional(),
  travelDates: z.array(travelDateRangeSchema),
  bookingWindow: bookingWindowSchema,
  bookingWindowRelative: bookingWindowRelativeSchema,
  conditions: z.array(
    z.discriminatedUnion("type", [
      supplierNightsConditionSchema,
      suppliersTotalConditionSchema,
      nightsTotalConditionSchema,
      paxNumberConditionSchema,
      paxAgeConditionSchema,
    ])
  ),
  actions: z.array(
    z.discriminatedUnion("type", [discountActionSchema, addOnActionSchema])
  ),
  isActive: z.boolean(),
});

type PromotionConditionType =
  | "SupplierNights"
  | "SuppliersTotal"
  | "NightsTotal"
  | "PaxNumber"
  | "PaxAge";

export interface CreatePromotionSubmitSchemaOptions {
  supplierIds?: string[];
  supplierCount?: number;
}

function addIssue(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  message: string
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

function getConditionTypeLabel(type: PromotionConditionType) {
  return tAdmin(`promotion.conditionTypes.${type}`);
}

function getConditionMinRequiredMessage(type: PromotionConditionType) {
  const minLabel =
    type === "PaxAge" ? tAdmin("labels.minAge") : tAdmin("labels.min");

  return tAdmin("validation.required", {
    field: `${getConditionTypeLabel(type)}: ${minLabel}`,
  });
}

function getConditionRangeRequiredMessage(type: PromotionConditionType) {
  const minLabel =
    type === "PaxAge" ? tAdmin("labels.minAge") : tAdmin("labels.min");
  const maxLabel =
    type === "PaxAge" ? tAdmin("labels.maxAge") : tAdmin("labels.max");

  return tAdmin("validation.required", {
    field: `${getConditionTypeLabel(type)}: ${minLabel} or ${maxLabel}`,
  });
}

function normalizeSelectableValue(value: string | null | undefined) {
  if (!value || value === PROMOTION_SELECT_ANY_VALUE) {
    return "";
  }

  return value.trim();
}

function getSupplierNightScopeSignature(condition: {
  supplierId: string | null;
  serviceId: string | null;
  optionText: string;
}) {
  return [
    condition.supplierId ?? "",
    normalizeSelectableValue(condition.serviceId),
    normalizeSelectableValue(condition.optionText),
  ].join("|");
}

function serializeDiscountRow(target: {
  paxCode?: string;
  paxIndexFrom?: number | null;
  paxIndexTo?: number | null;
  targetNightsType?: string;
  nightIndexFrom?: number | null;
  nightIndexTo?: number | null;
}) {
  return [
    target.paxCode ?? "",
    target.paxIndexFrom ?? "",
    target.paxIndexTo ?? "",
    target.targetNightsType ?? "",
    target.nightIndexFrom ?? "",
    target.nightIndexTo ?? "",
  ].join("|");
}

function validateRangeRequirement(
  ctx: z.RefinementCtx,
  {
    type,
    index,
    min,
    max,
    minPath,
    maxPath,
  }: {
    type: PromotionConditionType;
    index: number;
    min: number | null;
    max: number | null;
    minPath: string;
    maxPath: string;
  }
) {
  if (min == null && max == null) {
    addIssue(
      ctx,
      ["conditions", index, minPath],
      getConditionRangeRequiredMessage(type)
    );
  }

  if (max != null && min == null) {
    addIssue(
      ctx,
      ["conditions", index, minPath],
      getConditionMinRequiredMessage(type)
    );
  }

  if (min != null && max != null && max <= min) {
    addIssue(
      ctx,
      ["conditions", index, maxPath],
      tAdmin("validation.maxMustBeGreaterThanMin")
    );
  }
}

export function createPromotionSubmitSchema(
  options: CreatePromotionSubmitSchemaOptions = {}
) {
  const supplierIds = options.supplierIds ?? [];
  const supplierIdSet = new Set(supplierIds);
  const supplierCount = options.supplierCount ?? supplierIds.length;

  return createPromotionSubmitSchemaBase.superRefine((data, ctx) => {
    if (data.isPartiallySupported && !data.note.trim()) {
      addIssue(ctx, ["note"], tAdmin("validation.promotionNoteRequired"));
    }

    if (data.travelDates.length === 0) {
      addIssue(ctx, ["travelDates"], tAdmin("validation.atLeastOneTravelDate"));
    }

    const normalizedTravelRanges: Array<{
      index: number;
      from: string;
      to: string;
    }> = [];

    data.travelDates.forEach((range, index) => {
      if (!range.from) {
        addIssue(
          ctx,
          ["travelDates", index, "from"],
          tAdmin("validation.required", {
            field: tAdmin("labels.travelDatesFrom"),
          })
        );
      }

      if (!range.to) {
        addIssue(
          ctx,
          ["travelDates", index, "to"],
          tAdmin("validation.required", {
            field: tAdmin("labels.travelDatesTo"),
          })
        );
      }

      if (range.from && range.to) {
        if (range.from >= range.to) {
          addIssue(
            ctx,
            ["travelDates", index, "to"],
            tAdmin("validation.promotionDateRangeOrder")
          );
        } else {
          normalizedTravelRanges.push({
            index,
            from: range.from,
            to: range.to,
          });
        }
      }
    });

    const sortedRanges = [...normalizedTravelRanges].sort((a, b) =>
      a.from.localeCompare(b.from)
    );
    for (let index = 1; index < sortedRanges.length; index += 1) {
      const previous = sortedRanges[index - 1];
      const current = sortedRanges[index];
      if (current.from <= previous.to) {
        addIssue(
          ctx,
          ["travelDates", current.index],
          tAdmin("validation.promotionTravelDatesOverlap")
        );
      }
    }

    if (!data.bookingWindow.from) {
      addIssue(
        ctx,
        ["bookingWindow", "from"],
        tAdmin("validation.required", { field: tAdmin("labels.bookingWindow") })
      );
    }

    if (!data.bookingWindow.to) {
      addIssue(
        ctx,
        ["bookingWindow", "to"],
        tAdmin("validation.required", { field: tAdmin("labels.bookingWindow") })
      );
    }

    if (
      data.bookingWindow.from &&
      data.bookingWindow.to &&
      data.bookingWindow.from >= data.bookingWindow.to
    ) {
      addIssue(
        ctx,
        ["bookingWindow", "to"],
        tAdmin("validation.promotionDateRangeOrder")
      );
    }

    const latestTravelDateTo = normalizedTravelRanges
      .map((range) => range.to)
      .sort((left, right) => right.localeCompare(left))[0];

    if (
      latestTravelDateTo &&
      data.bookingWindow.to &&
      data.bookingWindow.to > latestTravelDateTo
    ) {
      addIssue(
        ctx,
        ["bookingWindow", "to"],
        tAdmin("validation.promotionBookingWindowWithinTravelDates")
      );
    }

    if (
      data.bookingWindowRelative.fromDays != null &&
      data.bookingWindowRelative.fromDays <= 0
    ) {
      addIssue(
        ctx,
        ["bookingWindowRelative", "fromDays"],
        tAdmin("validation.promotionPositiveInteger")
      );
    }

    if (
      data.bookingWindowRelative.toDays != null &&
      data.bookingWindowRelative.toDays <= 0
    ) {
      addIssue(
        ctx,
        ["bookingWindowRelative", "toDays"],
        tAdmin("validation.promotionPositiveInteger")
      );
    }

    if (
      data.bookingWindowRelative.fromDays != null &&
      data.bookingWindowRelative.toDays != null &&
      data.bookingWindowRelative.fromDays > data.bookingWindowRelative.toDays
    ) {
      addIssue(
        ctx,
        ["bookingWindowRelative", "toDays"],
        tAdmin("validation.promotionRelativeRangeOrder")
      );
    }

    if (data.conditions.length === 0) {
      addIssue(
        ctx,
        ["conditions"],
        tAdmin("validation.promotionAtLeastOneCondition")
      );
    }

    const supplierNightScopes = new Set<string>();
    const seenPaxNumberCodes = new Set<string>();
    const seenPaxAgeCodes = new Set<string>();
    let supplierNightConditionsCount = 0;
    let hasSupplierNightsCondition = false;
    let hasSuppliersTotalCondition = false;
    let hasNightsTotalCondition = false;

    data.conditions.forEach((condition, index) => {
      if (condition.type === "SupplierNights") {
        hasSupplierNightsCondition = true;
        supplierNightConditionsCount += 1;

        if (!condition.supplierId) {
          addIssue(
            ctx,
            ["conditions", index, "supplierId"],
            tAdmin("validation.required", { field: tAdmin("labels.supplier") })
          );
        }

        if (
          condition.supplierId &&
          supplierIdSet.size > 0 &&
          !supplierIdSet.has(condition.supplierId)
        ) {
          addIssue(
            ctx,
            ["conditions", index, "supplierId"],
            tAdmin("validation.promotionSupplierMustBelongToHeadOffice")
          );
        }

        if (condition.maxNights != null && condition.minNights == null) {
          addIssue(
            ctx,
            ["conditions", index, "minNights"],
            getConditionMinRequiredMessage("SupplierNights")
          );
        }

        if (
          condition.minNights != null &&
          condition.maxNights != null &&
          condition.maxNights <= condition.minNights
        ) {
          addIssue(
            ctx,
            ["conditions", index, "maxNights"],
            tAdmin("validation.maxMustBeGreaterThanMin")
          );
        }

        const supplierNightScope = getSupplierNightScopeSignature(condition);
        if (supplierNightScopes.has(supplierNightScope)) {
          addIssue(
            ctx,
            ["conditions", index],
            tAdmin("validation.promotionDuplicateCondition")
          );
        }
        supplierNightScopes.add(supplierNightScope);
      }

      if (condition.type === "SuppliersTotal") {
        if (hasSuppliersTotalCondition) {
          addIssue(
            ctx,
            ["conditions", index],
            tAdmin("validation.promotionDuplicateCondition")
          );
        }
        hasSuppliersTotalCondition = true;

        validateRangeRequirement(ctx, {
          type: "SuppliersTotal",
          index,
          min: condition.minSuppliers,
          max: condition.maxSuppliers,
          minPath: "minSuppliers",
          maxPath: "maxSuppliers",
        });
      }

      if (condition.type === "NightsTotal") {
        if (hasNightsTotalCondition) {
          addIssue(
            ctx,
            ["conditions", index],
            tAdmin("validation.promotionDuplicateCondition")
          );
        }
        hasNightsTotalCondition = true;

        validateRangeRequirement(ctx, {
          type: "NightsTotal",
          index,
          min: condition.minNights,
          max: condition.maxNights,
          minPath: "minNights",
          maxPath: "maxNights",
        });
      }

      if (condition.type === "PaxNumber") {
        validateRangeRequirement(ctx, {
          type: "PaxNumber",
          index,
          min: condition.minPax,
          max: condition.maxPax,
          minPath: "minPax",
          maxPath: "maxPax",
        });

        if (seenPaxNumberCodes.has(condition.paxCode)) {
          addIssue(
            ctx,
            ["conditions", index, "paxCode"],
            tAdmin("validation.promotionDuplicatePaxCondition")
          );
        }
        seenPaxNumberCodes.add(condition.paxCode);
      }

      if (condition.type === "PaxAge") {
        validateRangeRequirement(ctx, {
          type: "PaxAge",
          index,
          min: condition.minAge,
          max: condition.maxAge,
          minPath: "minAge",
          maxPath: "maxAge",
        });

        if (seenPaxAgeCodes.has(condition.paxCode)) {
          addIssue(
            ctx,
            ["conditions", index, "paxCode"],
            tAdmin("validation.promotionDuplicatePaxCondition")
          );
        }
        seenPaxAgeCodes.add(condition.paxCode);
      }
    });

    if (data.conditions.length > 0 && !hasSupplierNightsCondition) {
      addIssue(
        ctx,
        ["conditions"],
        tAdmin("validation.promotionSupplierNightsConditionRequired")
      );
    }

    if (supplierCount > 0 && supplierNightConditionsCount > supplierCount) {
      addIssue(
        ctx,
        ["conditions"],
        tAdmin("validation.promotionSupplierNightsExceedSuppliers")
      );
    }

    if (data.actions.length === 0) {
      addIssue(
        ctx,
        ["actions"],
        tAdmin("validation.promotionAtLeastOneAction")
      );
    }

    const seenActionTypes = new Set<string>();
    const seenDiscountRowSignatures = new Set<string>();

    data.actions.forEach((action, actionIndex) => {
      if (seenActionTypes.has(action.type)) {
        addIssue(
          ctx,
          ["actions", actionIndex],
          tAdmin("validation.promotionDuplicateActionType")
        );
      }
      seenActionTypes.add(action.type);

      if (action.type === "DiscountPercentage") {
        if (action.rows.length === 0) {
          addIssue(
            ctx,
            ["actions", actionIndex, "rows"],
            tAdmin("validation.promotionDiscountTargetsRequired")
          );
        }

        action.rows.forEach((row, rowIndex) => {
          if (row.discountPercent == null) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex, "discountPercent"],
              tAdmin("validation.required", {
                field: tAdmin("labels.discountPercent"),
              })
            );
          }

          if (row.paxIndexTo != null && row.paxIndexFrom == null) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex, "paxIndexFrom"],
              tAdmin("validation.required", {
                field: tAdmin("labels.paxFrom"),
              })
            );
          }

          if (
            row.paxIndexFrom != null &&
            row.paxIndexTo != null &&
            row.paxIndexTo < row.paxIndexFrom
          ) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex, "paxIndexTo"],
              tAdmin("validation.promotionIndexRangeOrder")
            );
          }

          if (
            row.targetNightsType === "ByIndex" &&
            row.nightIndexFrom == null
          ) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex, "nightIndexFrom"],
              tAdmin("validation.required", {
                field: tAdmin("labels.nightFrom"),
              })
            );
          }

          if (row.nightIndexTo != null && row.nightIndexFrom == null) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex, "nightIndexFrom"],
              tAdmin("validation.required", {
                field: tAdmin("labels.nightFrom"),
              })
            );
          }

          if (
            row.nightIndexFrom != null &&
            row.nightIndexTo != null &&
            row.nightIndexTo < row.nightIndexFrom
          ) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex, "nightIndexTo"],
              tAdmin("validation.promotionIndexRangeOrder")
            );
          }

          const rowSignature = serializeDiscountRow(row);
          if (seenDiscountRowSignatures.has(rowSignature)) {
            addIssue(
              ctx,
              ["actions", actionIndex, "rows", rowIndex],
              tAdmin("validation.promotionDuplicateTarget")
            );
          }
          seenDiscountRowSignatures.add(rowSignature);
        });
      }

      if (action.type === "AddOn") {
        if (action.items.length === 0) {
          addIssue(
            ctx,
            ["actions", actionIndex, "items"],
            tAdmin("validation.promotionAddOnRequired")
          );
        }

        action.items.forEach((item, itemIndex) => {
          if (!item.serviceTypeId) {
            addIssue(
              ctx,
              ["actions", actionIndex, "items", itemIndex, "serviceTypeId"],
              tAdmin("validation.required", {
                field: tAdmin("labels.serviceType"),
              })
            );
          }

          if (!item.value.trim()) {
            addIssue(
              ctx,
              ["actions", actionIndex, "items", itemIndex, "value"],
              tAdmin("validation.promotionAddOnRequired")
            );
          }
        });
      }
    });
  });
}

export type CreatePromotionSubmitSchema = ReturnType<
  typeof createPromotionSubmitSchema
>;

export type CreatePromotionSubmitData = z.output<CreatePromotionSubmitSchema>;
