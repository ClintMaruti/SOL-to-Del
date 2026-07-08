import { describe, expect, it } from "vitest";

import type { SupplierService } from "@/entities/supplier-services/types";

import { filterServicesByQuery, getServiceLabel } from "../lib/filter-services";

const base = (overrides: Partial<SupplierService>): SupplierService =>
  ({
    id: "s1",
    supplierId: "sup-1",
    name: "Camp",
    serviceTypeId: "st",
    isActive: true,
    tags: "",
    options: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: "",
    updatedAt: "",
    type: "accommodation",
    ...overrides,
  }) as SupplierService;

describe("filter-services", () => {
  describe("getServiceLabel", () => {
    it("prefers serviceName over name when present", () => {
      expect(
        getServiceLabel(base({ name: "A", serviceName: "Display Name" }))
      ).toBe("Display Name");
    });

    it("falls back to name", () => {
      expect(getServiceLabel(base({ name: "Only" }))).toBe("Only");
    });
  });

  describe("filterServicesByQuery", () => {
    const services = [
      base({ id: "1", name: "Family Tent" }),
      base({ id: "2", name: "Game Drive" }),
    ];

    it("returns all services when query is empty", () => {
      expect(filterServicesByQuery(services, "")).toHaveLength(2);
    });

    it("filters case-insensitively by label", () => {
      expect(filterServicesByQuery(services, "family")).toEqual([services[0]]);
    });
  });
});
