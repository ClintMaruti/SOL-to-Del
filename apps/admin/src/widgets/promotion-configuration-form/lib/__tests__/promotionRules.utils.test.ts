import { describe, expect, it } from "vitest";

import { getSelectableSupplierServices } from "../promotionRules.utils";

describe("promotionRules.utils", () => {
  it("filters supplier services to accommodation services using service type", () => {
    expect(
      getSelectableSupplierServices([
        {
          id: "service-1",
          supplierId: "supplier-1",
          name: "Camp",
          serviceTypeId: "service-type-accommodation",
          type: "accommodation",
          isActive: true,
          tags: "",
          options: [],
          rates: [],
          nominalSaleCode: null,
          purchaseNominalCode: null,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "service-2",
          supplierId: "supplier-1",
          name: "Game Drive",
          serviceTypeId: "service-type-activity",
          type: "activity",
          isActive: true,
          tags: "",
          options: [],
          rates: [],
          nominalSaleCode: null,
          purchaseNominalCode: null,
          createdAt: "",
          updatedAt: "",
        },
      ]).map((service) => service.id)
    ).toEqual(["service-1"]);
  });
});
