import { describe, expect, it } from "vitest";

import type { SupplierService } from "@/entities/supplier-services";

import { supplierServiceDetailToFormData } from "./supplierServiceDetailToFormData";

describe("supplierServiceDetailToFormData", () => {
  it("maps from/to location ids into edit form state", () => {
    const service: SupplierService = {
      id: "service-1",
      supplierId: "supplier-1",
      serviceTypeId: "type-1",
      name: "Arusha - Chem Chem",
      alternativeName: undefined,
      locationId: undefined,
      fromLocationId: "from-id",
      toLocationId: "to-id",
      description: undefined,
      tags: "",
      nominalSaleCode: "K300-5",
      purchaseNominalCode: "K200-5",
      isActive: true,
      options: [],
      rates: [],
      createdAt: "",
      updatedAt: "",
      type: "Transportation",
    };

    const formValues = supplierServiceDetailToFormData(service);

    expect(formValues.fromLocationId).toBe("from-id");
    expect(formValues.toLocationId).toBe("to-id");
  });
});
