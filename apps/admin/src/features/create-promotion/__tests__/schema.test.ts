import { describe, expect, it } from "vitest";

import { PROMOTION_SELECT_ANY_VALUE } from "../../../entities/promotion/model/types";

import {
  createPromotionSubmitSchema,
  type CreatePromotionSubmitSchemaOptions,
} from "../model/schema";

const validPromotionFormValues = {
  name: "Stay 4 Pay 3",
  isPartiallySupported: false,
  note: "",
  travelDates: [
    {
      id: "travel-1",
      from: "2026-06-01",
      to: "2026-10-31",
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
      type: "SupplierNights" as const,
      supplierId: "supplier-1",
      serviceId: null,
      optionText: "",
      minNights: 4,
      maxNights: null,
    },
  ],
  actions: [
    {
      id: "action-1",
      type: "DiscountPercentage" as const,
      rows: [
        {
          id: "discount-row-1",
          discountPercent: 25,
          paxCode: "ANY" as const,
          paxIndexFrom: null,
          paxIndexTo: null,
          targetNightsType: "Cheapest" as const,
          nightIndexFrom: null,
          nightIndexTo: null,
        },
      ],
    },
  ],
  isActive: false,
};

function getSubmitSchema(
  options: CreatePromotionSubmitSchemaOptions = {
    supplierIds: ["supplier-1", "supplier-2"],
    supplierCount: 2,
  }
) {
  return createPromotionSubmitSchema(options);
}

describe("createPromotionSubmitSchema", () => {
  it("accepts valid promotion form values", () => {
    const result = getSubmitSchema().safeParse(validPromotionFormValues);

    expect(result.success).toBe(true);
  });

  it("allows ANY as a target nights type", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      actions: [
        {
          id: "action-1",
          type: "DiscountPercentage" as const,
          rows: [
            {
              id: "discount-row-1",
              discountPercent: 25,
              paxCode: "ANY" as const,
              paxIndexFrom: null,
              paxIndexTo: null,
              targetNightsType: "ANY" as const,
              nightIndexFrom: null,
              nightIndexTo: null,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("preserves hidden backend metadata fields needed for update payloads", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      version: 1350,
      noteId: "note-1",
      noteVersion: 12,
      travelDates: [
        {
          id: "travel-1",
          from: "2026-06-01",
          to: "2026-10-31",
          version: 22,
        },
      ],
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights" as const,
          supplierId: "supplier-1",
          serviceId: null,
          optionText: "",
          minNights: 4,
          maxNights: null,
          version: 33,
        },
      ],
      actions: [
        {
          id: "action-1",
          type: "DiscountPercentage" as const,
          rows: [
            {
              id: "discount-row-1",
              discountPercent: 25,
              paxCode: "ANY" as const,
              paxIndexFrom: null,
              paxIndexTo: null,
              targetNightsType: "Cheapest" as const,
              nightIndexFrom: null,
              nightIndexTo: null,
              version: 44,
              actionId: "action-1",
              actionVersion: 55,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.version).toBe(1350);
      expect(result.data.noteId).toBe("note-1");
      expect(result.data.noteVersion).toBe(12);
      expect(result.data.travelDates[0]?.version).toBe(22);
      expect(result.data.conditions[0]?.version).toBe(33);
      const discountAction = result.data.actions[0];
      if (discountAction?.type === "DiscountPercentage") {
        expect(discountAction.rows[0]?.version).toBe(44);
        expect(discountAction.rows[0]?.actionId).toBe("action-1");
        expect(discountAction.rows[0]?.actionVersion).toBe(55);
      }
    }
  });

  it("enforces promotion name length between 3 and 64 characters", () => {
    const tooShort = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      name: "Hi",
    });

    const tooLong = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      name: "A".repeat(65),
    });

    expect(tooShort.success).toBe(false);
    expect(tooLong.success).toBe(false);
  });

  it("requires note when partially supported is enabled", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      isPartiallySupported: true,
      note: "   ",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find((item) => item.path[0] === "note");
      expect(issue?.message).toBe(
        "Note is required when partially supported is enabled"
      );
    }
  });

  it("rejects overlapping travel date ranges", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      travelDates: [
        {
          id: "travel-1",
          from: "2026-06-01",
          to: "2026-06-10",
        },
        {
          id: "travel-2",
          from: "2026-06-05",
          to: "2026-06-12",
        },
      ],
      bookingWindow: {
        from: "2026-01-01",
        to: "2026-06-10",
      },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "travelDates" &&
          typeof item.path[1] === "number" &&
          item.path[1] === 1
      );
      expect(issue?.message).toBe("Travel date ranges must not overlap.");
    }
  });

  it("requires at least one supplier nights condition", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        {
          id: "condition-1",
          type: "NightsTotal" as const,
          minNights: 4,
          maxNights: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === "conditions" &&
            issue.message ===
              "At least one Supplier Nights condition is required."
        )
      ).toBe(true);
    }
  });

  it("rejects supplier nights rows with suppliers outside the current head office", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights" as const,
          supplierId: "supplier-outside",
          serviceId: null,
          optionText: "",
          minNights: 4,
          maxNights: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "conditions" &&
          item.path[1] === 0 &&
          item.path[2] === "supplierId"
      );
      expect(issue?.message).toBe(
        "Selected supplier must belong to this Head Office."
      );
    }
  });

  it("rejects more supplier nights rows than suppliers under the head office", () => {
    const result = getSubmitSchema({
      supplierIds: ["supplier-1"],
      supplierCount: 1,
    }).safeParse({
      ...validPromotionFormValues,
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights" as const,
          supplierId: "supplier-1",
          serviceId: null,
          optionText: "",
          minNights: 4,
          maxNights: null,
        },
        {
          id: "condition-2",
          type: "SupplierNights" as const,
          supplierId: "supplier-1",
          serviceId: "service-2",
          optionText: "",
          minNights: 2,
          maxNights: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === "conditions" &&
            issue.message ===
              "Supplier Nights conditions cannot exceed the number of suppliers under this Head Office."
        )
      ).toBe(true);
    }
  });

  it("allows min-only ranges for non-supplier-night conditions", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        validPromotionFormValues.conditions[0],
        {
          id: "condition-2",
          type: "SuppliersTotal" as const,
          minSuppliers: 2,
          maxSuppliers: null,
        },
        {
          id: "condition-3",
          type: "NightsTotal" as const,
          minNights: 6,
          maxNights: null,
        },
        {
          id: "condition-4",
          type: "PaxNumber" as const,
          paxCode: "ADT" as const,
          minPax: 2,
          maxPax: null,
        },
        {
          id: "condition-5",
          type: "PaxAge" as const,
          paxCode: "CHD" as const,
          minAge: 5,
          maxAge: null,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("allows supplier nights without min and max", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights" as const,
          supplierId: "supplier-1",
          serviceId: null,
          optionText: "",
          minNights: null,
          maxNights: null,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty ranges when both min and max are missing", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        validPromotionFormValues.conditions[0],
        {
          id: "condition-2",
          type: "SuppliersTotal" as const,
          minSuppliers: null,
          maxSuppliers: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "conditions" &&
          item.path[1] === 1 &&
          item.path[2] === "minSuppliers"
      );
      expect(issue?.message).toBe("Suppliers Total: Min or Max is required");
    }
  });

  it("rejects max-only ranges because max requires min", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        validPromotionFormValues.conditions[0],
        {
          id: "condition-2",
          type: "PaxAge" as const,
          paxCode: "CHD" as const,
          minAge: null,
          maxAge: 12,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "conditions" &&
          item.path[1] === 1 &&
          item.path[2] === "minAge"
      );
      expect(issue?.message).toBe("PAX Age: min age is required");
    }
  });

  it("uses translated max-greater-than-min messaging", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        validPromotionFormValues.conditions[0],
        {
          id: "condition-2",
          type: "NightsTotal" as const,
          minNights: 5,
          maxNights: 4,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "conditions" &&
          item.path[1] === 1 &&
          item.path[2] === "maxNights"
      );
      expect(issue?.message).toBe("Max must be greater than min");
    }
  });

  it("rejects duplicate supplier-night scopes even when min/max differ", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        {
          id: "condition-1",
          type: "SupplierNights" as const,
          supplierId: "supplier-1",
          serviceId: null,
          optionText: "",
          minNights: 4,
          maxNights: null,
        },
        {
          id: "condition-2",
          type: "SupplierNights" as const,
          supplierId: "supplier-1",
          serviceId: PROMOTION_SELECT_ANY_VALUE,
          optionText: PROMOTION_SELECT_ANY_VALUE,
          minNights: 8,
          maxNights: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === "conditions" &&
            issue.path[1] === 1 &&
            issue.message === "Duplicate conditions are not allowed."
        )
      ).toBe(true);
    }
  });

  it("rejects duplicate single-instance conditions", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        validPromotionFormValues.conditions[0],
        {
          id: "condition-2",
          type: "SuppliersTotal" as const,
          minSuppliers: 2,
          maxSuppliers: null,
        },
        {
          id: "condition-3",
          type: "SuppliersTotal" as const,
          minSuppliers: 3,
          maxSuppliers: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === "conditions" &&
            issue.path[1] === 2 &&
            issue.message === "Duplicate conditions are not allowed."
        )
      ).toBe(true);
    }
  });

  it("rejects duplicate pax conditions within the same condition type", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      conditions: [
        validPromotionFormValues.conditions[0],
        {
          id: "condition-2",
          type: "PaxNumber" as const,
          paxCode: "ADT" as const,
          minPax: 2,
          maxPax: null,
        },
        {
          id: "condition-3",
          type: "PaxNumber" as const,
          paxCode: "ADT" as const,
          minPax: 3,
          maxPax: null,
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "conditions" &&
          typeof item.path[1] === "number" &&
          item.path[1] === 2 &&
          item.path[2] === "paxCode"
      );
      expect(issue?.message).toBe(
        "This pax type is already used for the selected condition type."
      );
    }
  });

  it("requires a service type for add-on actions", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      actions: [
        {
          id: "action-1",
          type: "AddOn" as const,
          items: [
            {
              id: "add-on-1",
              serviceTypeId: null,
              value: "Balloon ride",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (item) =>
          item.path[0] === "actions" &&
          item.path[1] === 0 &&
          item.path[2] === "items" &&
          item.path[3] === 0 &&
          item.path[4] === "serviceTypeId"
      );
      expect(issue?.message).toBe("Service Type is required");
    }
  });

  it("rejects duplicate discount row scopes", () => {
    const result = getSubmitSchema().safeParse({
      ...validPromotionFormValues,
      actions: [
        {
          id: "action-1",
          type: "DiscountPercentage" as const,
          rows: [
            {
              id: "discount-row-1",
              discountPercent: 25,
              paxCode: "ANY" as const,
              paxIndexFrom: null,
              paxIndexTo: null,
              targetNightsType: "Cheapest" as const,
              nightIndexFrom: null,
              nightIndexTo: null,
            },
            {
              id: "discount-row-2",
              discountPercent: 10,
              paxCode: "ANY" as const,
              paxIndexFrom: null,
              paxIndexTo: null,
              targetNightsType: "Cheapest" as const,
              nightIndexFrom: null,
              nightIndexTo: null,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (item) => item.message === "Duplicate targets are not allowed."
        )
      ).toBe(true);
    }
  });
});
