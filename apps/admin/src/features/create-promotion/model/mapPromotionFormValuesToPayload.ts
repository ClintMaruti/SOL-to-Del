import {
  type CreatePromotionPayload,
  PROMOTION_SELECT_ANY_VALUE,
  type PromotionDiscountTargetType,
  type PromotionFormAction,
  type PromotionFormAddOnItem,
  type PromotionFormCondition,
  type PromotionFormDiscountRow,
  type PromotionFormValues,
  type PromotionWritePayload,
  type UpdatePromotionPayload,
  toPromotionDetailPaxType,
} from "@/entities/promotion";

type PromotionPayloadMode = "create" | "update";

function normalizeAnyValue(value: string | null | undefined) {
  if (!value || value === PROMOTION_SELECT_ANY_VALUE) {
    return null;
  }

  return value;
}

function toRangeValue(
  min: number | null | undefined,
  max: number | null | undefined
): NonNullable<PromotionWritePayload["conditions"][number]["nights"]> {
  return {
    min: min ?? null,
    max: max ?? null,
  };
}

const TEMP_FORM_ID_PREFIXES = [
  "travel-date-",
  "condition-",
  "discount-row-",
  "action-",
  "add-on-item-",
] as const;

function isTemporaryFormId(id: string) {
  return TEMP_FORM_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

function getPersistedId(
  id: string | null | undefined,
  version: number | null | undefined
) {
  if (!id) {
    return undefined;
  }

  if (version != null) {
    return id;
  }

  if (isTemporaryFormId(id)) {
    return undefined;
  }

  return id;
}

function withOptionalId<T extends object>(id: string | undefined, value: T) {
  if (!id) {
    return value;
  }

  return {
    id,
    ...value,
  };
}

function withOptionalVersion<T extends object>(
  id: string | undefined,
  version: number | null | undefined,
  value: T
) {
  if (!id || version == null) {
    return value;
  }

  return {
    version,
    ...value,
  };
}

function withPersistedMetadata<T extends object>(
  id: string | undefined,
  version: number | null | undefined,
  value: T
) {
  return withOptionalId(id, withOptionalVersion(id, version, value));
}

function shouldIncludePersistedMetadata(mode: PromotionPayloadMode) {
  return mode === "update";
}

function getPayloadId(
  mode: PromotionPayloadMode,
  id: string | null | undefined,
  version: number | null | undefined
) {
  if (!shouldIncludePersistedMetadata(mode)) {
    return undefined;
  }

  return getPersistedId(id, version);
}

function mapCondition(
  condition: PromotionFormCondition,
  mode: PromotionPayloadMode
): PromotionWritePayload["conditions"][number] {
  const persistedId = getPayloadId(mode, condition.id, condition.version);
  const base = {
    supplierId: null,
    serviceId: null,
    optionText: null,
    paxType: null,
    nights: null,
    suppliers: null,
    nightsTotal: null,
    paxCount: null,
    age: null,
  } satisfies Omit<PromotionWritePayload["conditions"][number], "type">;

  switch (condition.type) {
    case "SupplierNights":
      return withPersistedMetadata(persistedId, condition.version, {
        ...base,
        type: condition.type,
        supplierId: condition.supplierId,
        serviceId: normalizeAnyValue(condition.serviceId),
        optionText: normalizeAnyValue(condition.optionText.trim()),
        nights: toRangeValue(condition.minNights, condition.maxNights),
      });
    case "SuppliersTotal":
      return withPersistedMetadata(persistedId, condition.version, {
        ...base,
        type: condition.type,
        suppliers: toRangeValue(condition.minSuppliers, condition.maxSuppliers),
      });
    case "NightsTotal":
      return withPersistedMetadata(persistedId, condition.version, {
        ...base,
        type: condition.type,
        nightsTotal: toRangeValue(condition.minNights, condition.maxNights),
      });
    case "PaxNumber":
      return withPersistedMetadata(persistedId, condition.version, {
        ...base,
        type: condition.type,
        paxType: toPromotionDetailPaxType(condition.paxCode),
        paxCount: toRangeValue(condition.minPax, condition.maxPax),
      });
    case "PaxAge":
      return withPersistedMetadata(persistedId, condition.version, {
        ...base,
        type: condition.type,
        paxType: toPromotionDetailPaxType(condition.paxCode),
        age: toRangeValue(condition.minAge, condition.maxAge),
      });
  }
}

function getDiscountTargetType(
  row: PromotionFormDiscountRow
): PromotionDiscountTargetType {
  if (
    row.paxCode !== "ANY" ||
    row.paxIndexFrom != null ||
    row.paxIndexTo != null
  ) {
    return "Pax";
  }

  return "Nights";
}

function mapDiscountAction(
  row: PromotionFormDiscountRow,
  mode: PromotionPayloadMode
): PromotionWritePayload["actions"][number] {
  const persistedActionId = getPayloadId(mode, row.actionId, row.actionVersion);
  const persistedDiscountId = getPayloadId(mode, row.id, row.version);

  return withPersistedMetadata(persistedActionId, row.actionVersion, {
    type: "DiscountPercentage",
    addOn: null,
    discount: withPersistedMetadata(persistedDiscountId, row.version, {
      discountPercent: row.discountPercent ?? null,
      targetType: getDiscountTargetType(row),
      paxType: toPromotionDetailPaxType(row.paxCode),
      paxIndexFrom: row.paxIndexFrom ?? null,
      paxIndexTo: row.paxIndexTo ?? null,
      targetNightsType: row.targetNightsType,
      nightsIndexFrom: row.nightIndexFrom ?? null,
      nightsIndexTo: row.nightIndexTo ?? null,
    }),
  });
}

function mapAddOn(
  addOnItem: PromotionFormAddOnItem,
  mode: PromotionPayloadMode
): NonNullable<PromotionWritePayload["actions"][number]["addOn"]> {
  const persistedAddOnId = getPayloadId(mode, addOnItem.id, addOnItem.version);

  return withPersistedMetadata(persistedAddOnId, addOnItem.version, {
    serviceTypeId: addOnItem.serviceTypeId ?? null,
    name: addOnItem.value.trim(),
  });
}

function mapAddOnAction(
  item: PromotionFormAddOnItem,
  mode: PromotionPayloadMode
): PromotionWritePayload["actions"][number] {
  const persistedActionId = getPayloadId(
    mode,
    item.actionId,
    item.actionVersion
  );

  return withPersistedMetadata(persistedActionId, item.actionVersion, {
    type: "AddOn",
    addOn: mapAddOn(item, mode),
    discount: null,
  });
}

function mapAction(
  action: PromotionFormAction,
  mode: PromotionPayloadMode
): PromotionWritePayload["actions"] {
  if (action.type === "DiscountPercentage") {
    return action.rows.map((row) => mapDiscountAction(row, mode));
  }

  return action.items.map((item) => mapAddOnAction(item, mode));
}

function mapNote(
  formValues: PromotionFormValues,
  mode: PromotionPayloadMode
): PromotionWritePayload["note"] {
  const text = formValues.note.trim();

  if (!text) {
    return null;
  }

  return {
    ...withPersistedMetadata(
      getPayloadId(mode, formValues.noteId, formValues.noteVersion),
      formValues.noteVersion,
      { text }
    ),
  };
}

export function mapPromotionFormValuesToPayload(
  formValues: PromotionFormValues,
  mode: "create"
): CreatePromotionPayload;
export function mapPromotionFormValuesToPayload(
  formValues: PromotionFormValues,
  mode?: "update"
): UpdatePromotionPayload;
export function mapPromotionFormValuesToPayload(
  formValues: PromotionFormValues,
  mode: PromotionPayloadMode = "update"
): PromotionWritePayload {
  const bookingWindowRelative =
    formValues.bookingWindowRelative.fromDays == null &&
    formValues.bookingWindowRelative.toDays == null
      ? null
      : {
          fromDays: formValues.bookingWindowRelative.fromDays,
          toDays: formValues.bookingWindowRelative.toDays,
        };

  const payloadBase = {
    name: formValues.name.trim(),
    isPartiallySupported: formValues.isPartiallySupported,
    note: mapNote(formValues, mode),
    travelDates: formValues.travelDates.map((range) =>
      withPersistedMetadata(
        getPayloadId(mode, range.id, range.version),
        range.version,
        {
          from: range.from,
          to: range.to,
        }
      )
    ),
    bookingWindow: {
      from: formValues.bookingWindow.from,
      to: formValues.bookingWindow.to,
    },
    bookingWindowRelative,
    conditions: formValues.conditions.map((condition) =>
      mapCondition(condition, mode)
    ),
    actions: formValues.actions.flatMap((action) => mapAction(action, mode)),
    isActive: formValues.isActive,
  };

  if (mode === "create") {
    return payloadBase;
  }

  return {
    version: formValues.version!,
    ...payloadBase,
  };
}
