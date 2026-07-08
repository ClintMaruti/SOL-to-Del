import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useRef } from "react";

import type {
  PromotionConditionType,
  PromotionFormAction,
  PromotionFormAddOnAction,
  PromotionFormAddOnItem,
  PromotionFormCondition,
  PromotionFormDiscountRow,
  PromotionFormDiscountPercentageAction,
  PromotionFormTravelDateRange,
  PromotionFormValues,
} from "@/entities/promotion";
import { useValueBasedDirty } from "@/shared/hooks";
import { formDataEqual } from "@/shared/lib/form";

const PROMOTION_FORM_VALUE_KEYS = [
  "name",
  "isPartiallySupported",
  "note",
  "travelDates",
  "bookingWindow",
  "bookingWindowRelative",
  "conditions",
  "actions",
  "isActive",
] as const;

function createFormValueId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createPromotionTravelDateRangeFormValue(): PromotionFormTravelDateRange {
  return {
    id: createFormValueId("travel-date"),
    from: "",
    to: "",
    version: null,
  };
}

export function createPromotionConditionFormValue(
  type: PromotionConditionType = "SupplierNights"
): PromotionFormCondition {
  const id = createFormValueId("condition");

  switch (type) {
    case "SuppliersTotal":
      return {
        id,
        type,
        minSuppliers: null,
        maxSuppliers: null,
        version: null,
      };
    case "NightsTotal":
      return {
        id,
        type,
        minNights: null,
        maxNights: null,
        version: null,
      };
    case "PaxNumber":
      return {
        id,
        type,
        paxCode: "ANY",
        minPax: null,
        maxPax: null,
        version: null,
      };
    case "PaxAge":
      return {
        id,
        type,
        paxCode: "ANY",
        minAge: null,
        maxAge: null,
        version: null,
      };
    case "SupplierNights":
    default:
      return {
        id,
        type: "SupplierNights",
        supplierId: null,
        serviceId: null,
        optionText: "",
        minNights: null,
        maxNights: null,
        version: null,
      };
  }
}

export function createPromotionDiscountRowFormValue(
  actionId?: string | null,
  actionVersion?: number | null
): PromotionFormDiscountRow {
  return {
    id: createFormValueId("discount-row"),
    discountPercent: null,
    paxCode: "ANY",
    paxIndexFrom: null,
    paxIndexTo: null,
    targetNightsType: "ANY",
    nightIndexFrom: null,
    nightIndexTo: null,
    version: null,
    actionId: actionId ?? null,
    actionVersion: actionVersion ?? null,
  };
}

export function createPromotionDiscountActionFormValue(): PromotionFormDiscountPercentageAction {
  return {
    id: createFormValueId("action"),
    type: "DiscountPercentage",
    rows: [createPromotionDiscountRowFormValue()],
  };
}

export function createPromotionAddOnItemFormValue(
  actionId?: string | null,
  actionVersion?: number | null
): PromotionFormAddOnItem {
  return {
    id: createFormValueId("add-on-item"),
    itemType: "Other",
    value: "",
    version: null,
    actionId: actionId ?? null,
    actionVersion: actionVersion ?? null,
    serviceTypeId: null,
  };
}

export function createPromotionAddOnActionFormValue(): PromotionFormAddOnAction {
  return {
    id: createFormValueId("action"),
    type: "AddOn",
    items: [createPromotionAddOnItemFormValue()],
  };
}

export function createInitialPromotionFormValues(): PromotionFormValues {
  return {
    version: null,
    name: "",
    isPartiallySupported: false,
    note: "",
    noteId: null,
    noteVersion: null,
    travelDates: [createPromotionTravelDateRangeFormValue()],
    bookingWindow: {
      from: "",
      to: "",
    },
    bookingWindowRelative: {
      fromDays: null,
      toDays: null,
    },
    conditions: [createPromotionConditionFormValue("SupplierNights")],
    actions: [],
    isActive: false,
  };
}

function clonePromotionFormValues(
  formValues: PromotionFormValues
): PromotionFormValues {
  if (typeof structuredClone === "function") {
    return structuredClone(formValues);
  }

  return {
    version: formValues.version ?? null,
    name: formValues.name,
    isPartiallySupported: formValues.isPartiallySupported,
    note: formValues.note,
    noteId: formValues.noteId ?? null,
    noteVersion: formValues.noteVersion ?? null,
    travelDates: formValues.travelDates.map((range) => ({ ...range })),
    bookingWindow: { ...formValues.bookingWindow },
    bookingWindowRelative: { ...formValues.bookingWindowRelative },
    conditions: formValues.conditions.map((condition) => ({ ...condition })),
    actions: formValues.actions.map((action) =>
      action.type === "DiscountPercentage"
        ? {
            ...action,
            rows: action.rows.map((row) => ({ ...row })),
          }
        : {
            ...action,
            items: action.items.map((item) => ({ ...item })),
          }
    ),
    isActive: formValues.isActive,
  };
}

export function usePromotionForm(initialData?: PromotionFormValues | null) {
  const defaultInitialRef = useRef<PromotionFormValues>(
    createInitialPromotionFormValues()
  );
  const defaultInitial = defaultInitialRef.current;
  const previousInitialRef = useRef<PromotionFormValues | null | undefined>(
    initialData ? clonePromotionFormValues(initialData) : initialData
  );

  const form = useForm({
    defaultValues: initialData
      ? clonePromotionFormValues(initialData)
      : clonePromotionFormValues(defaultInitial),
  });
  const values = useStore(
    form.store,
    (state) => state.values as PromotionFormValues
  );

  const {
    isDirty,
    reset: resetDirty,
    setBaseline,
    setHasSeenFormMatchingInitial,
  } = useValueBasedDirty<PromotionFormValues>(
    values,
    initialData ?? null,
    PROMOTION_FORM_VALUE_KEYS,
    defaultInitial
  );

  useEffect(() => {
    if (initialData == null) return;

    const nextInitial = clonePromotionFormValues(initialData);
    const previousInitial = previousInitialRef.current;
    const dataChanged =
      previousInitial == null ||
      !formDataEqual(previousInitial, nextInitial, PROMOTION_FORM_VALUE_KEYS);

    if (!dataChanged) return;

    previousInitialRef.current = nextInitial;
    form.reset(nextInitial);
    queueMicrotask(() => {
      setHasSeenFormMatchingInitial(false);
      setBaseline(clonePromotionFormValues(nextInitial));
    });
  }, [form, initialData, setBaseline, setHasSeenFormMatchingInitial]);

  const reset = useCallback(
    (nextInitial?: PromotionFormValues | null) => {
      const next = nextInitial
        ? clonePromotionFormValues(nextInitial)
        : initialData
          ? clonePromotionFormValues(initialData)
          : clonePromotionFormValues(defaultInitial);

      previousInitialRef.current = nextInitial
        ? clonePromotionFormValues(nextInitial)
        : initialData
          ? clonePromotionFormValues(initialData)
          : undefined;

      resetDirty(next);
      form.reset(next);
    },
    [defaultInitial, form, initialData, resetDirty]
  );

  return {
    form,
    isDirty,
    reset,
  };
}

export function hasPromotionAction(
  actions: PromotionFormAction[],
  type: PromotionFormAction["type"]
) {
  return actions.some((action) => action.type === type);
}
