import { describe, expect, it } from "vitest";

import { PROMOTION_SELECT_ANY_VALUE } from "../../../entities/promotion/model/types";

import { mapPromotionFormValuesToPayload } from "../model/mapPromotionFormValuesToPayload";

describe("mapPromotionFormValuesToPayload", () => {
  it("trims values and removes form-only ids", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: 1350,
        name: "  Stay 4 Pay 3  ",
        isPartiallySupported: true,
        note: "  Needs planner review  ",
        noteId: "019d76e0-1111-7222-ac1e-874ae89b7001",
        noteVersion: 4,
        travelDates: [
          {
            id: "019d76e0-1111-7222-ac1e-874ae89b7002",
            from: "2026-06-01",
            to: "2026-10-31",
            version: 3,
          },
        ],
        bookingWindow: {
          from: "2026-01-01",
          to: "2026-05-31",
        },
        bookingWindowRelative: {
          fromDays: null,
          toDays: null,
        },
        conditions: [
          {
            id: "019d76e0-1111-7222-ac1e-874ae89b7003",
            type: "SupplierNights",
            supplierId: "supplier-1",
            serviceId: "service-1",
            optionText: "  Full Board  ",
            minNights: 4,
            maxNights: null,
            version: 5,
          },
        ],
        actions: [
          {
            id: "action-1",
            type: "DiscountPercentage",
            rows: [
              {
                id: "019d76e0-1111-7222-ac1e-874ae89b7004",
                discountPercent: 25,
                paxCode: "ADT",
                paxIndexFrom: 1,
                paxIndexTo: 2,
                targetNightsType: "Cheapest",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: 6,
                actionId: "019d76e0-1111-7222-ac1e-874ae89b7005",
                actionVersion: 7,
              },
            ],
          },
        ],
        isActive: false,
      },
      "update"
    );

    expect(payload).toEqual({
      version: 1350,
      name: "Stay 4 Pay 3",
      isPartiallySupported: true,
      note: {
        id: "019d76e0-1111-7222-ac1e-874ae89b7001",
        text: "Needs planner review",
        version: 4,
      },
      travelDates: [
        {
          id: "019d76e0-1111-7222-ac1e-874ae89b7002",
          version: 3,
          from: "2026-06-01",
          to: "2026-10-31",
        },
      ],
      bookingWindow: {
        from: "2026-01-01",
        to: "2026-05-31",
      },
      bookingWindowRelative: null,
      conditions: [
        {
          id: "019d76e0-1111-7222-ac1e-874ae89b7003",
          version: 5,
          type: "SupplierNights",
          supplierId: "supplier-1",
          serviceId: "service-1",
          optionText: "Full Board",
          paxType: null,
          nights: {
            min: 4,
            max: null,
          },
          suppliers: null,
          nightsTotal: null,
          paxCount: null,
          age: null,
        },
      ],
      actions: [
        {
          id: "019d76e0-1111-7222-ac1e-874ae89b7005",
          version: 7,
          type: "DiscountPercentage",
          addOn: null,
          discount: {
            id: "019d76e0-1111-7222-ac1e-874ae89b7004",
            version: 6,
            discountPercent: 25,
            targetType: "Pax",
            paxType: "Adult",
            paxIndexFrom: 1,
            paxIndexTo: 2,
            targetNightsType: "Cheapest",
            nightsIndexFrom: null,
            nightsIndexTo: null,
          },
        },
      ],
      isActive: false,
    });
  });

  it("keeps relative booking window when at least one bound is set", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: 12,
        name: "Stay 4 Pay 3",
        isPartiallySupported: false,
        note: "",
        noteId: null,
        noteVersion: null,
        travelDates: [
          {
            id: "travel-1",
            from: "2026-06-01",
            to: "2026-10-31",
            version: null,
          },
        ],
        bookingWindow: {
          from: "2026-01-01",
          to: "2026-05-31",
        },
        bookingWindowRelative: {
          fromDays: 30,
          toDays: 60,
        },
        conditions: [
          {
            id: "condition-1",
            type: "SuppliersTotal",
            minSuppliers: 2,
            maxSuppliers: null,
            version: 2,
          },
        ],
        actions: [
          {
            id: "action-1",
            type: "AddOn",
            items: [
              {
                id: "019d76e0-1111-7222-ac1e-874ae89b7006",
                value: " Balloon ride ",
                version: 8,
                actionId: "019d76e0-1111-7222-ac1e-874ae89b7007",
                actionVersion: 9,
                serviceTypeId: "service-type-other",
              },
            ],
          },
        ],
        isActive: true,
      },
      "update"
    );

    expect(payload.bookingWindowRelative).toEqual({
      fromDays: 30,
      toDays: 60,
    });
    expect(payload.version).toBe(12);
    expect(payload.actions).toEqual([
      {
        id: "019d76e0-1111-7222-ac1e-874ae89b7007",
        version: 9,
        type: "AddOn",
        addOn: {
          id: "019d76e0-1111-7222-ac1e-874ae89b7006",
          version: 8,
          serviceTypeId: "service-type-other",
          name: "Balloon ride",
        },
        discount: null,
      },
    ]);
  });

  it("maps explicit ANY selections to null in the payload", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: null,
        name: "Stay Longer",
        isPartiallySupported: false,
        note: "",
        noteId: null,
        noteVersion: null,
        travelDates: [
          {
            id: "travel-1",
            from: "2026-06-01",
            to: "2026-10-31",
            version: null,
          },
        ],
        bookingWindow: {
          from: "2026-01-01",
          to: "2026-05-31",
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
            serviceId: PROMOTION_SELECT_ANY_VALUE,
            optionText: PROMOTION_SELECT_ANY_VALUE,
            minNights: 4,
            maxNights: null,
            version: null,
          },
        ],
        actions: [
          {
            id: "action-1",
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
                version: null,
                actionId: null,
                actionVersion: null,
              },
            ],
          },
        ],
        isActive: false,
      },
      "create"
    );

    expect(payload.conditions).toEqual([
      {
        type: "SupplierNights",
        supplierId: "supplier-1",
        serviceId: null,
        optionText: null,
        paxType: null,
        nights: {
          min: 4,
          max: null,
        },
        suppliers: null,
        nightsTotal: null,
        paxCount: null,
        age: null,
      },
    ]);
    expect(payload.conditions[0]).not.toHaveProperty("id");
    expect(payload.conditions[0]).not.toHaveProperty("version");
    expect(payload.actions).toEqual([
      {
        type: "DiscountPercentage",
        addOn: null,
        discount: {
          discountPercent: 10,
          targetType: "Nights",
          paxType: null,
          paxIndexFrom: null,
          paxIndexTo: null,
          targetNightsType: "Cheapest",
          nightsIndexFrom: null,
          nightsIndexTo: null,
        },
      },
    ]);
    expect(payload.actions[0]).not.toHaveProperty("id");
    expect(payload.actions[0]).not.toHaveProperty("version");
    expect(payload.actions[0]?.discount).not.toHaveProperty("id");
    expect(payload.actions[0]?.discount).not.toHaveProperty("version");
    expect(payload).not.toHaveProperty("version");
  });

  it("preserves ANY target nights type in the payload", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: null,
        name: "Stay Longer",
        isPartiallySupported: false,
        note: "",
        noteId: null,
        noteVersion: null,
        travelDates: [
          {
            id: "travel-1",
            from: "2026-06-01",
            to: "2026-10-31",
            version: null,
          },
        ],
        bookingWindow: {
          from: "2026-01-01",
          to: "2026-05-31",
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
            minNights: 4,
            maxNights: null,
            version: null,
          },
        ],
        actions: [
          {
            id: "action-1",
            type: "DiscountPercentage",
            rows: [
              {
                id: "discount-row-1",
                discountPercent: 10,
                paxCode: "ANY",
                paxIndexFrom: null,
                paxIndexTo: null,
                targetNightsType: "ANY",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: null,
                actionId: null,
                actionVersion: null,
              },
            ],
          },
        ],
        isActive: false,
      },
      "create"
    );

    expect(payload.actions[0]?.discount?.targetNightsType).toBe("ANY");
  });

  it("keeps backend ids even when version is missing, but still strips temp form ids", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: 1350,
        name: "Some promotions",
        isPartiallySupported: false,
        note: "Backend note",
        noteId: "019d76e0-1111-7222-ac1e-874ae89b7010",
        noteVersion: null,
        travelDates: [
          {
            id: "019d76e0-1111-7222-ac1e-874ae89b7011",
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
            id: "019d76e0-1111-7222-ac1e-874ae89b7012",
            type: "SupplierNights",
            supplierId: "supplier-1",
            serviceId: null,
            optionText: "",
            minNights: 1,
            maxNights: 3,
            version: null,
          },
          {
            id: "condition-local-temp",
            type: "SuppliersTotal",
            minSuppliers: 2,
            maxSuppliers: null,
            version: null,
          },
        ],
        actions: [
          {
            id: "action-local-temp",
            type: "DiscountPercentage",
            rows: [
              {
                id: "019d76e0-1111-7222-ac1e-874ae89b7013",
                discountPercent: 1,
                paxCode: "ANY",
                paxIndexFrom: null,
                paxIndexTo: null,
                targetNightsType: "Cheapest",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: null,
                actionId: "019d76e0-1111-7222-ac1e-874ae89b7014",
                actionVersion: null,
              },
              {
                id: "discount-row-local-temp",
                discountPercent: 2,
                paxCode: "ANY",
                paxIndexFrom: null,
                paxIndexTo: null,
                targetNightsType: "Cheapest",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: null,
                actionId: "action-local-temp",
                actionVersion: null,
              },
            ],
          },
        ],
        isActive: false,
      },
      "update"
    );

    expect(payload.note?.id).toBe("019d76e0-1111-7222-ac1e-874ae89b7010");
    expect(payload.travelDates[0]?.id).toBe(
      "019d76e0-1111-7222-ac1e-874ae89b7011"
    );
    expect(payload.conditions[0]?.id).toBe(
      "019d76e0-1111-7222-ac1e-874ae89b7012"
    );
    expect(payload.note).not.toHaveProperty("version");
    expect(payload.conditions[1]).not.toHaveProperty("id");
    expect(payload.conditions[1]).not.toHaveProperty("version");
    expect(payload.actions[0]?.id).toBe("019d76e0-1111-7222-ac1e-874ae89b7014");
    expect(payload.actions[0]).not.toHaveProperty("version");
    expect(payload.actions[0]?.discount?.id).toBe(
      "019d76e0-1111-7222-ac1e-874ae89b7013"
    );
    expect(payload.actions[0]?.discount).not.toHaveProperty("version");
    expect(payload.actions[1]).not.toHaveProperty("id");
    expect(payload.actions[1]).not.toHaveProperty("version");
    expect(payload.actions[1]?.discount).not.toHaveProperty("id");
    expect(payload.actions[1]?.discount).not.toHaveProperty("version");
  });

  it("keeps persisted action metadata only on existing discount rows and omits it for newly added rows", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: 1350,
        name: "Some promotions",
        isPartiallySupported: false,
        note: "",
        noteId: null,
        noteVersion: null,
        travelDates: [
          {
            id: "019d76e0-1111-7222-ac1e-874ae89b7020",
            from: "2026-04-01",
            to: "2026-04-30",
            version: 1352,
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
            id: "019d76e0-1111-7222-ac1e-874ae89b7021",
            type: "SupplierNights",
            supplierId: "supplier-1",
            serviceId: null,
            optionText: "",
            minNights: 1,
            maxNights: 3,
            version: 1352,
          },
        ],
        actions: [
          {
            id: "action-wrapper-1",
            type: "DiscountPercentage",
            rows: [
              {
                id: "019d76e0-1111-7222-ac1e-874ae89b7022",
                discountPercent: 10,
                paxCode: "ANY",
                paxIndexFrom: null,
                paxIndexTo: null,
                targetNightsType: "Cheapest",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: 1352,
                actionId: "019d76e0-1111-7222-ac1e-874ae89b7023",
                actionVersion: 1352,
              },
              {
                id: "discount-row-new-temp",
                discountPercent: 20,
                paxCode: "ANY",
                paxIndexFrom: null,
                paxIndexTo: null,
                targetNightsType: "Cheapest",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: null,
                actionId: null,
                actionVersion: null,
              },
            ],
          },
        ],
        isActive: false,
      },
      "update"
    );

    expect(payload.actions).toEqual([
      {
        id: "019d76e0-1111-7222-ac1e-874ae89b7023",
        version: 1352,
        type: "DiscountPercentage",
        addOn: null,
        discount: {
          id: "019d76e0-1111-7222-ac1e-874ae89b7022",
          version: 1352,
          discountPercent: 10,
          targetType: "Nights",
          paxType: null,
          paxIndexFrom: null,
          paxIndexTo: null,
          targetNightsType: "Cheapest",
          nightsIndexFrom: null,
          nightsIndexTo: null,
        },
      },
      {
        type: "DiscountPercentage",
        addOn: null,
        discount: {
          discountPercent: 20,
          targetType: "Nights",
          paxType: null,
          paxIndexFrom: null,
          paxIndexTo: null,
          targetNightsType: "Cheapest",
          nightsIndexFrom: null,
          nightsIndexTo: null,
        },
      },
    ]);
  });

  it("keeps persisted action metadata only on existing add-ons and omits it for newly added items", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: 1350,
        name: "Some promotions",
        isPartiallySupported: false,
        note: "",
        noteId: null,
        noteVersion: null,
        travelDates: [
          {
            id: "019d76e0-1111-7222-ac1e-874ae89b7030",
            from: "2026-04-01",
            to: "2026-04-30",
            version: 1352,
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
            id: "019d76e0-1111-7222-ac1e-874ae89b7031",
            type: "SupplierNights",
            supplierId: "supplier-1",
            serviceId: null,
            optionText: "",
            minNights: 1,
            maxNights: 3,
            version: 1352,
          },
        ],
        actions: [
          {
            id: "action-wrapper-2",
            type: "AddOn",
            items: [
              {
                id: "019d76e0-1111-7222-ac1e-874ae89b7032",
                value: "Airport transfer",
                version: 1352,
                actionId: "019d76e0-1111-7222-ac1e-874ae89b7033",
                actionVersion: 1352,
                serviceTypeId: "service-type-other",
              },
              {
                id: "add-on-item-new-temp",
                value: "Welcome drink",
                version: null,
                actionId: null,
                actionVersion: null,
                serviceTypeId: "service-type-other",
              },
            ],
          },
        ],
        isActive: false,
      },
      "update"
    );

    expect(payload.actions).toEqual([
      {
        id: "019d76e0-1111-7222-ac1e-874ae89b7033",
        version: 1352,
        type: "AddOn",
        addOn: {
          id: "019d76e0-1111-7222-ac1e-874ae89b7032",
          version: 1352,
          serviceTypeId: "service-type-other",
          name: "Airport transfer",
        },
        discount: null,
      },
      {
        type: "AddOn",
        addOn: {
          serviceTypeId: "service-type-other",
          name: "Welcome drink",
        },
        discount: null,
      },
    ]);
  });

  it("maps empty numeric condition and discount fields to null instead of zero", () => {
    const payload = mapPromotionFormValuesToPayload(
      {
        version: 1350,
        name: "Some promotions",
        isPartiallySupported: false,
        note: "",
        noteId: null,
        noteVersion: null,
        travelDates: [
          {
            id: "019d76e0-1111-7222-ac1e-874ae89b7040",
            from: "2026-04-01",
            to: "2026-04-30",
            version: 1352,
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
            id: "019d76e0-1111-7222-ac1e-874ae89b7041",
            type: "SuppliersTotal",
            minSuppliers: null,
            maxSuppliers: null,
            version: 1352,
          },
        ],
        actions: [
          {
            id: "action-wrapper-3",
            type: "DiscountPercentage",
            rows: [
              {
                id: "019d76e0-1111-7222-ac1e-874ae89b7042",
                discountPercent: null,
                paxCode: "ANY",
                paxIndexFrom: null,
                paxIndexTo: null,
                targetNightsType: "Cheapest",
                nightIndexFrom: null,
                nightIndexTo: null,
                version: 1352,
                actionId: "019d76e0-1111-7222-ac1e-874ae89b7043",
                actionVersion: 1352,
              },
            ],
          },
        ],
        isActive: false,
      },
      "update"
    );

    expect(payload.conditions).toEqual([
      {
        id: "019d76e0-1111-7222-ac1e-874ae89b7041",
        version: 1352,
        type: "SuppliersTotal",
        supplierId: null,
        serviceId: null,
        optionText: null,
        paxType: null,
        nights: null,
        suppliers: {
          min: null,
          max: null,
        },
        nightsTotal: null,
        paxCount: null,
        age: null,
      },
    ]);

    expect(payload.actions).toEqual([
      {
        id: "019d76e0-1111-7222-ac1e-874ae89b7043",
        version: 1352,
        type: "DiscountPercentage",
        addOn: null,
        discount: {
          id: "019d76e0-1111-7222-ac1e-874ae89b7042",
          version: 1352,
          discountPercent: null,
          targetType: "Nights",
          paxType: null,
          paxIndexFrom: null,
          paxIndexTo: null,
          targetNightsType: "Cheapest",
          nightsIndexFrom: null,
          nightsIndexTo: null,
        },
      },
    ]);
  });
});
