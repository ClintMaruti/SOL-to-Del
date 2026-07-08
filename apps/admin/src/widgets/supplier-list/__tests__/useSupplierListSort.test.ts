import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Supplier } from "@/entities/suppliers/model/types";

import { useSupplierListSort } from "../model/useSupplierListSort";

const createSupplier = (
  id: string,
  name: string,
  code: string,
  headOfficeName: string,
  locationName: string,
  isActive = true
): Supplier =>
  ({
    id,
    name,
    headOfficeName,
    locationName,
    code,
    email: `${id}@test.com`,
    phone: "+255 000 000 000",
    isActive,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
  }) as Supplier;

const mockSuppliers: Supplier[] = [
  createSupplier("sup-1", "Charlie Co.", "CHR-001", "ho-c", "ho-c", true),
  createSupplier("sup-2", "Alpha Ltd", "ALP-002", "ho-a", "ho-a", false),
  createSupplier("sup-3", "Beta Camp", "BET-003", "ho-b", "ho-b", true),
];

describe("useSupplierListSort", () => {
  describe("Initial State", () => {
    it("should return suppliers unsorted initially", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      expect(result.current.sortState.field).toBeNull();
      expect(result.current.sortState.direction).toBe("asc");
      expect(result.current.sortedSuppliers).toEqual(mockSuppliers);
    });
  });

  describe("Sort by Name", () => {
    it("should sort by name ascending", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortState.field).toBe("name");
      expect(result.current.sortState.direction).toBe("asc");
      expect(result.current.sortedSuppliers[0].name).toBe("Alpha Ltd");
      expect(result.current.sortedSuppliers[1].name).toBe("Beta Camp");
      expect(result.current.sortedSuppliers[2].name).toBe("Charlie Co.");
    });

    it("should sort by name descending on second click", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      act(() => {
        result.current.toggleSort("name");
      });
      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortState.direction).toBe("desc");
      expect(result.current.sortedSuppliers[0].name).toBe("Charlie Co.");
      expect(result.current.sortedSuppliers[2].name).toBe("Alpha Ltd");
    });
  });

  describe("Sort by Code", () => {
    it("should sort by code ascending", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      act(() => {
        result.current.toggleSort("code");
      });

      expect(result.current.sortedSuppliers[0].code).toBe("ALP-002");
      expect(result.current.sortedSuppliers[1].code).toBe("BET-003");
      expect(result.current.sortedSuppliers[2].code).toBe("CHR-001");
    });
  });

  describe("Sort by Head Office", () => {
    it("should sort by headOfficeName ascending", () => {
      const getHeadOfficeName = (s: Supplier) =>
        s.headOfficeName === "ho-a"
          ? "Ho A"
          : s.headOfficeName === "ho-b"
            ? "Ho B"
            : "Ho C";
      const { result } = renderHook(() =>
        useSupplierListSort(mockSuppliers, { getHeadOfficeName })
      );

      act(() => {
        result.current.toggleSort("headOfficeName");
      });

      expect(result.current.sortState.field).toBe("headOfficeName");
      expect(result.current.sortState.direction).toBe("asc");
      expect(result.current.sortedSuppliers[0].headOfficeName).toBe("ho-a");
      expect(result.current.sortedSuppliers[1].headOfficeName).toBe("ho-b");
      expect(result.current.sortedSuppliers[2].headOfficeName).toBe("ho-c");
    });
  });

  describe("Sort by Location", () => {
    it("should sort by getLocation when provided", () => {
      const getLocation = (s: Supplier) =>
        s.locationName === "ho-a"
          ? "Nairobi"
          : s.locationName === "ho-b"
            ? "Arusha"
            : s.locationName === "ho-c"
              ? "Moshi"
              : "";
      const { result } = renderHook(() =>
        useSupplierListSort(mockSuppliers, { getLocation })
      );

      act(() => {
        result.current.toggleSort("locationName");
      });

      expect(result.current.sortedSuppliers[0].locationName).toBe("ho-b");
      expect(result.current.sortedSuppliers[1].locationName).toBe("ho-c");
      expect(result.current.sortedSuppliers[2].locationName).toBe("ho-a");
    });
  });

  describe("Sort by isActive", () => {
    it("should sort by isActive (active first when ascending)", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      act(() => {
        result.current.toggleSort("isActive");
      });

      expect(result.current.sortedSuppliers[0].isActive).toBe(true);
      expect(result.current.sortedSuppliers[1].isActive).toBe(true);
      expect(result.current.sortedSuppliers[2].isActive).toBe(false);
    });

    it("should sort by isActive descending (inactive first)", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      act(() => {
        result.current.toggleSort("isActive");
      });
      act(() => {
        result.current.toggleSort("isActive");
      });

      expect(result.current.sortedSuppliers[0].isActive).toBe(false);
      expect(result.current.sortedSuppliers[2].isActive).toBe(true);
    });
  });

  describe("Switch sort field", () => {
    it("should reset to ascending when switching to a different field", () => {
      const { result } = renderHook(() => useSupplierListSort(mockSuppliers));

      act(() => {
        result.current.toggleSort("name");
      });
      act(() => {
        result.current.toggleSort("name");
      });
      expect(result.current.sortState.direction).toBe("desc");

      act(() => {
        result.current.toggleSort("code");
      });

      expect(result.current.sortState.field).toBe("code");
      expect(result.current.sortState.direction).toBe("asc");
    });
  });
});
