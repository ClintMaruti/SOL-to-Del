import { describe, expect, it } from "vitest";

import type { PromotionFormValues } from "@/entities/promotion";

import {
  getPromotionErrorFieldNames,
  mapPromotionApiErrorPathToFormField,
  toPromotionFormErrors,
} from "../model/promotionApiValidationErrors";

const formValues: PromotionFormValues = {
  version: 1,
  name: "Promo",
  isPartiallySupported: false,
  note: "",
  noteId: null,
  noteVersion: null,
  travelDates: [
    {
      id: "travel-1",
      from: "2026-04-01",
      to: "2026-04-30",
      version: null,
    },
  ],
  bookingWindow: {
    from: "2026-04-08",
    to: "2026-04-22",
  },
  bookingWindowRelative: {
    fromDays: null,
    toDays: null,
  },
  conditions: [
    {
      id: "condition-1",
      type: "SupplierNights",
      supplierId: "supplier-1",
      serviceId: null,
      optionText: "",
      minNights: 1,
      maxNights: 3,
      version: 10,
    },
    {
      id: "condition-2",
      type: "NightsTotal",
      minNights: 5,
      maxNights: 7,
      version: 11,
    },
  ],
  actions: [
    {
      id: "action-discount",
      type: "DiscountPercentage",
      rows: [
        {
          id: "discount-row-1",
          discountPercent: 10,
          paxCode: "ANY",
          paxIndexFrom: null,
          paxIndexTo: null,
          targetNightsType: "Cheapest",
          nightIndexFrom: null,
          nightIndexTo: null,
          version: 12,
          actionId: "backend-action-1",
          actionVersion: 13,
        },
      ],
    },
    {
      id: "action-addon",
      type: "AddOn",
      items: [
        {
          id: "add-on-1",
          value: "Balloon ride",
          version: 14,
          actionId: "backend-action-2",
          actionVersion: 15,
          serviceTypeId: "service-type-1",
        },
      ],
    },
  ],
  isActive: false,
};

describe("promotionApiValidationErrors", () => {
  it("maps condition payload paths back to form field paths", () => {
    expect(
      mapPromotionApiErrorPathToFormField(
        "conditions[1].nightsTotal.max",
        formValues
      )
    ).toBe("conditions[1].maxNights");
  });

  it("maps flattened discount payload paths back to grouped form rows", () => {
    expect(
      mapPromotionApiErrorPathToFormField(
        "actions[0].discount.nightsIndexTo",
        formValues
      )
    ).toBe("actions[0].rows[0].nightIndexTo");
  });

  it("maps flattened add-on payload paths back to grouped form items", () => {
    expect(
      mapPromotionApiErrorPathToFormField("actions[1].addOn.name", formValues)
    ).toBe("actions[1].items[0].value");
  });

  it("maps API validation errors to real form fields and top-level sections", () => {
    const formErrors = toPromotionFormErrors(
      {
        "conditions[1].nights.max": [
          "Maximum value must be greater than minimum value.",
        ],
        "actions[0].discount.discountPercent": ["Discount is required."],
      },
      formValues
    );

    expect(formErrors).toEqual({
      "conditions[1].maxNights":
        "Maximum value must be greater than minimum value.",
      "actions[0].rows[0].discountPercent": "Discount is required.",
    });

    expect(getPromotionErrorFieldNames(Object.keys(formErrors))).toEqual([
      "conditions",
      "actions",
    ]);
  });
});
