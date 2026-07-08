import {
  PROMOTION_SELECT_ANY_VALUE,
  type PromotionDetail,
  type PromotionDetailAction,
  type PromotionDetailCondition,
  type PromotionFormAction,
  type PromotionFormAddOnItem,
  type PromotionFormCondition,
  type PromotionFormDiscountRow,
  type PromotionFormValues,
} from "./types";
import { toPromotionFormPaxCode } from "./paxType";

function toSelectableAnyValue(value: string | null | undefined) {
  return value ?? PROMOTION_SELECT_ANY_VALUE;
}

function fromApiOptionalNumber(value: number | null | undefined) {
  if (value == null || value === 0) {
    return null;
  }

  return value;
}

function fromApiRangeMin(
  range: { min: number; max: number } | null | undefined
) {
  return fromApiOptionalNumber(range?.min);
}

function fromApiRangeMax(
  range: { min: number; max: number } | null | undefined
) {
  return fromApiOptionalNumber(range?.max);
}

function mapCondition(
  condition: PromotionDetailCondition
): PromotionFormCondition {
  switch (condition.type) {
    case "SupplierNights":
      return {
        id: condition.id ?? `condition-${condition.supplierId ?? "generated"}`,
        type: condition.type,
        supplierId: condition.supplierId,
        serviceId: toSelectableAnyValue(condition.serviceId),
        optionText: toSelectableAnyValue(condition.optionText),
        minNights: fromApiRangeMin(condition.nights),
        maxNights: fromApiRangeMax(condition.nights),
        version: condition.version,
      };
    case "SuppliersTotal":
      return {
        id: condition.id ?? "condition-suppliers-total",
        type: condition.type,
        minSuppliers: fromApiRangeMin(condition.suppliers),
        maxSuppliers: fromApiRangeMax(condition.suppliers),
        version: condition.version,
      };
    case "NightsTotal":
      return {
        id: condition.id ?? "condition-nights-total",
        type: condition.type,
        minNights: fromApiRangeMin(condition.nightsTotal),
        maxNights: fromApiRangeMax(condition.nightsTotal),
        version: condition.version,
      };
    case "PaxNumber":
      return {
        id:
          condition.id ?? `condition-pax-number-${condition.paxType ?? "Any"}`,
        type: condition.type,
        paxCode: toPromotionFormPaxCode(condition.paxType),
        minPax: fromApiRangeMin(condition.paxCount),
        maxPax: fromApiRangeMax(condition.paxCount),
        version: condition.version,
      };
    case "PaxAge":
      return {
        id: condition.id ?? `condition-pax-age-${condition.paxType ?? "Any"}`,
        type: condition.type,
        paxCode: toPromotionFormPaxCode(condition.paxType),
        minAge: fromApiRangeMin(condition.age),
        maxAge: fromApiRangeMax(condition.age),
        version: condition.version,
      };
  }
}

function mapDiscountRow(
  action: PromotionDetailAction
): PromotionFormDiscountRow | null {
  if (action.type !== "DiscountPercentage") {
    return null;
  }

  return {
    id: action.discount?.id ?? `discount-row-${action.id}`,
    discountPercent: fromApiOptionalNumber(action.discount?.discountPercent),
    paxCode: toPromotionFormPaxCode(action.discount?.paxType),
    paxIndexFrom: fromApiOptionalNumber(action.discount?.paxIndexFrom),
    paxIndexTo: fromApiOptionalNumber(action.discount?.paxIndexTo),
    targetNightsType:
      action.discount?.targetNightsType?.toLowerCase() === "any"
        ? "ANY"
        : (action.discount?.targetNightsType ?? "ANY"),
    nightIndexFrom: fromApiOptionalNumber(action.discount?.nightsIndexFrom),
    nightIndexTo: fromApiOptionalNumber(action.discount?.nightsIndexTo),
    version: action.discount?.version ?? null,
    actionId: action.id,
    actionVersion: action.version,
  };
}

function mapAddOnItem(
  action: PromotionDetailAction
): PromotionFormAddOnItem | null {
  if (action.type !== "AddOn") {
    return null;
  }

  return {
    id: action.addOn?.id ?? `add-on-item-${action.id}`,
    itemType: "Other",
    value: action.addOn?.name ?? "",
    version: action.addOn?.version ?? null,
    actionId: action.id,
    actionVersion: action.version,
    serviceTypeId: action.addOn?.serviceTypeId ?? null,
  };
}

function mapActions(actions: PromotionDetailAction[]): PromotionFormAction[] {
  const discountRows = actions
    .map(mapDiscountRow)
    .filter((row): row is PromotionFormDiscountRow => Boolean(row));
  const addOnItems = actions
    .map(mapAddOnItem)
    .filter((item): item is PromotionFormAddOnItem => Boolean(item));

  const mappedActions: PromotionFormAction[] = [];

  if (discountRows.length > 0) {
    mappedActions.push({
      id:
        discountRows[0]?.actionId ??
        actions.find((action) => action.discount)?.id ??
        "action-discount",
      type: "DiscountPercentage",
      rows: discountRows,
    });
  }

  if (addOnItems.length > 0) {
    mappedActions.push({
      id:
        addOnItems[0]?.actionId ??
        actions.find((action) => action.addOn)?.id ??
        "action-add-on",
      type: "AddOn",
      items: addOnItems,
    });
  }

  return mappedActions;
}

export function promotionDetailToFormValues(
  detail: PromotionDetail
): PromotionFormValues {
  const relativeWindow = detail.bookingWindowRelative;
  const isEmptyRelativeWindow =
    !relativeWindow ||
    (relativeWindow.fromDays === 0 && relativeWindow.toDays === 0);

  return {
    version: detail.version ?? null,
    name: detail.name,
    isPartiallySupported: detail.isPartiallySupported,
    note: detail.note?.text ?? "",
    noteId: detail.note?.id ?? null,
    noteVersion: detail.note?.version ?? null,
    travelDates:
      detail.travelDates.length > 0
        ? detail.travelDates.map((range, index) => ({
            id: range.id ?? `travel-date-${index}`,
            from: range.from,
            to: range.to,
            version: range.version ?? null,
          }))
        : [],
    bookingWindow: {
      from: detail.bookingWindow.from,
      to: detail.bookingWindow.to,
    },
    bookingWindowRelative:
      !relativeWindow || isEmptyRelativeWindow
        ? {
            fromDays: null,
            toDays: null,
          }
        : {
            fromDays: relativeWindow.fromDays,
            toDays: relativeWindow.toDays,
          },
    conditions: detail.conditions.map(mapCondition),
    actions: mapActions(detail.actions),
    isActive: detail.isActive,
  };
}
