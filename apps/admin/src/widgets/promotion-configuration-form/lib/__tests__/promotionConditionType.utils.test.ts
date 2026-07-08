import { describe, expect, it } from "vitest";

import { changePromotionConditionType } from "../promotionConditionType.utils";

describe("promotionConditionType.utils", () => {
  it("preserves persisted id and version when changing condition type", () => {
    expect(
      changePromotionConditionType(
        {
          id: "condition-1",
          type: "SupplierNights",
          supplierId: "supplier-1",
          serviceId: "service-1",
          optionText: "Full Board",
          minNights: 2,
          maxNights: 4,
          version: 1350,
        },
        "NightsTotal"
      )
    ).toEqual({
      id: "condition-1",
      type: "NightsTotal",
      minNights: 2,
      maxNights: 4,
      version: 1350,
    });
  });

  it("keeps compatible values when changing between pax condition types", () => {
    expect(
      changePromotionConditionType(
        {
          id: "condition-2",
          type: "PaxNumber",
          paxCode: "CHD",
          minPax: 1,
          maxPax: 3,
          version: 42,
        },
        "PaxAge"
      )
    ).toEqual({
      id: "condition-2",
      type: "PaxAge",
      paxCode: "CHD",
      minAge: 1,
      maxAge: 3,
      version: 42,
    });
  });
});
