import { describe, expect, it } from "vitest";

import { PROMOTION_SELECT_ANY_VALUE } from "../model/types";

import { promotionDetailToFormValues } from "../model/promotionDetailToFormValues";
import type { PromotionDetail } from "../model/types";

describe("promotionDetailToFormValues", () => {
  it("maps nullable selectors to explicit ANY values and preserves version", () => {
    const formValues = promotionDetailToFormValues({
      id: "promo-1",
      name: "Long Stay Discount",
      headOfficeId: "sho-1",
      isPartiallySupported: false,
      note: null,
      travelDates: [
        {
          id: "travel-1",
          from: "2027-01-01",
          to: "2027-12-31",
          version: 1,
        },
      ],
      bookingWindow: {
        from: "2027-01-01",
        to: "2027-12-31",
      },
      bookingWindowRelative: {
        fromDays: 0,
        toDays: 0,
      },
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights",
          supplierId: "sup-1",
          serviceId: null,
          optionText: null,
          paxType: "Any",
          nights: {
            min: 4,
            max: 0,
          },
          suppliers: {
            min: 0,
            max: 0,
          },
          nightsTotal: {
            min: 0,
            max: 0,
          },
          paxCount: {
            min: 0,
            max: 0,
          },
          age: {
            min: 0,
            max: 0,
          },
          version: 1,
        },
      ],
      actions: [
        {
          id: "action-1",
          type: "AddOn",
          addOn: {
            id: "item-1",
            serviceTypeId: null,
            name: "Balloon ride",
            version: 1,
          },
          discount: null,
          version: 1,
        },
      ],
      isActive: true,
      version: 7,
    } as PromotionDetail);

    expect(formValues.version).toBe(7);
    expect(formValues.note).toBe("");
    expect(formValues.bookingWindowRelative).toEqual({
      fromDays: null,
      toDays: null,
    });
    expect(formValues.conditions).toEqual([
      {
        id: "condition-1",
        type: "SupplierNights",
        supplierId: "sup-1",
        serviceId: PROMOTION_SELECT_ANY_VALUE,
        optionText: PROMOTION_SELECT_ANY_VALUE,
        minNights: 4,
        maxNights: null,
        version: 1,
      },
    ]);
    expect(formValues.actions).toEqual([
      {
        id: "action-1",
        type: "AddOn",
        items: [
          {
            id: "item-1",
            itemType: "Other",
            value: "Balloon ride",
            version: 1,
            actionId: "action-1",
            actionVersion: 1,
            serviceTypeId: null,
          },
        ],
      },
    ]);
  });

  it("handles the nullable detail payload shape returned by the API", () => {
    const formValues = promotionDetailToFormValues({
      id: "019d76e0-5223-7294-ac1e-874ae89b7349",
      headOfficeId: "019cb297-d6b0-7956-b583-17464310cd5b",
      name: "Some promotions",
      isActive: false,
      isPartiallySupported: false,
      note: null,
      travelDates: [
        {
          id: "019d76e0-5255-77b4-bc50-e4bac835a86b",
          from: "2026-04-01",
          to: "2026-04-30",
          version: 1350,
        },
      ],
      bookingWindow: {
        from: "2026-04-08",
        to: "2026-04-22",
      },
      bookingWindowRelative: null,
      conditions: [
        {
          id: "019d76e0-5245-7bd9-976c-2b5fd757e9e7",
          type: "SupplierNights",
          supplierId: "019cf888-271c-72ca-9719-e94207cc3436",
          serviceId: null,
          optionText: null,
          paxType: null,
          nights: null,
          suppliers: null,
          nightsTotal: null,
          paxCount: null,
          age: null,
          version: 1350,
        },
      ],
      actions: [
        {
          id: "019d76e0-5236-7c43-8a6a-0ddc26943be7",
          type: "DiscountPercentage",
          addOn: null,
          discount: null,
          version: 1350,
        },
      ],
      version: 1350,
    } as PromotionDetail);

    expect(formValues.bookingWindowRelative).toEqual({
      fromDays: null,
      toDays: null,
    });
    expect(formValues.conditions).toEqual([
      {
        id: "019d76e0-5245-7bd9-976c-2b5fd757e9e7",
        type: "SupplierNights",
        supplierId: "019cf888-271c-72ca-9719-e94207cc3436",
        serviceId: PROMOTION_SELECT_ANY_VALUE,
        optionText: PROMOTION_SELECT_ANY_VALUE,
        minNights: null,
        maxNights: null,
        version: 1350,
      },
    ]);
    expect(formValues.actions).toEqual([
      {
        id: "019d76e0-5236-7c43-8a6a-0ddc26943be7",
        type: "DiscountPercentage",
        rows: [
          {
            id: "discount-row-019d76e0-5236-7c43-8a6a-0ddc26943be7",
            discountPercent: null,
            paxCode: "ANY",
            paxIndexFrom: null,
            paxIndexTo: null,
            targetNightsType: "ANY",
            nightIndexFrom: null,
            nightIndexTo: null,
            version: null,
            actionId: "019d76e0-5236-7c43-8a6a-0ddc26943be7",
            actionVersion: 1350,
          },
        ],
      },
    ]);
  });

  it("keeps action rows visible when the API returns action shells without nested data", () => {
    const formValues = promotionDetailToFormValues({
      id: "promo-1",
      headOfficeId: "sho-1",
      name: "Some promotions",
      isActive: false,
      isPartiallySupported: false,
      note: null,
      travelDates: [
        {
          id: "travel-1",
          from: "2026-04-01",
          to: "2026-04-30",
          version: 1352,
        },
      ],
      bookingWindow: {
        from: "2026-04-08",
        to: "2026-04-22",
      },
      bookingWindowRelative: null,
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights",
          supplierId: "supplier-1",
          serviceId: null,
          optionText: null,
          paxType: null,
          nights: null,
          suppliers: null,
          nightsTotal: null,
          paxCount: null,
          age: null,
          version: 1352,
        },
      ],
      actions: [
        {
          id: "action-discount-1",
          type: "DiscountPercentage",
          addOn: null,
          discount: null,
          version: 1352,
        },
        {
          id: "action-addon-1",
          type: "AddOn",
          addOn: null,
          discount: null,
          version: 1352,
        },
      ],
      version: 1350,
    } as PromotionDetail);

    expect(formValues.actions).toEqual([
      {
        id: "action-discount-1",
        type: "DiscountPercentage",
        rows: [
          {
            id: "discount-row-action-discount-1",
            discountPercent: null,
            paxCode: "ANY",
            paxIndexFrom: null,
            paxIndexTo: null,
            targetNightsType: "ANY",
            nightIndexFrom: null,
            nightIndexTo: null,
            version: null,
            actionId: "action-discount-1",
            actionVersion: 1352,
          },
        ],
      },
      {
        id: "action-addon-1",
        type: "AddOn",
        items: [
          {
            id: "add-on-item-action-addon-1",
            itemType: "Other",
            value: "",
            version: null,
            actionId: "action-addon-1",
            actionVersion: 1352,
            serviceTypeId: null,
          },
        ],
      },
    ]);
  });
});
