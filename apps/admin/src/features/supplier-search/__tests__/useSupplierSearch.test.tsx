import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Supplier } from "@/entities/suppliers/model/types";

import { useSupplierSearch } from "../model/useSupplierSearch";

const DEBOUNCE_MS = 300;

const createSupplier = (
  id: string,
  name: string,
  code: string,
  email: string,
  phone: string,
  headOfficeName = "sho-1"
): Supplier => ({
  id,
  name,
  headOfficeName,
  code,
  locationName: "",
  email,
  phone,
  isActive: true,
  paymentTermId: "pt-1",
  isDeleted: false,
  deletedAt: null,
});

const mockSuppliers: Supplier[] = [
  createSupplier(
    "sup-1",
    "Elewana Lodges & Camps",
    "ELW-001",
    "bookings@elewanalodges.com",
    "+255 123 456 789"
  ),
  createSupplier(
    "sup-2",
    "Serengeti Safari Co.",
    "SSC-002",
    "inquiries@serengetisafarico.com",
    "+255 234 567 890"
  ),
  createSupplier(
    "sup-3",
    "Kilimanjaro Trekking Ltd",
    "KTL-003",
    "treks@kilimanjaroltd.com",
    "+255 345 678 901"
  ),
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const advanceDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
};

describe("useSupplierSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial State", () => {
    it("should return all suppliers when search query is empty", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      expect(result.current.searchQuery).toBe("");
      expect(result.current.filteredSuppliers).toHaveLength(3);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return empty results for empty suppliers array", () => {
      const { result } = renderHook(() => useSupplierSearch([]), { wrapper });

      expect(result.current.filteredSuppliers).toHaveLength(0);
      expect(result.current.hasResults).toBe(false);
    });

    it("should initialize search query from URL when present", () => {
      const wrapperWithSearch = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={["/suppliers?search=elewana"]}>
          {children}
        </MemoryRouter>
      );
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper: wrapperWithSearch,
      });

      expect(result.current.searchQuery).toBe("elewana");
    });
  });

  describe("Minimum query length (3 characters)", () => {
    it("should return all suppliers when query has fewer than 3 characters", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("el");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(3);
    });

    it("should filter when query has 3 or more characters", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("ele");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].name).toBe(
        "Elewana Lodges & Camps"
      );
    });
  });

  describe("Search by Name", () => {
    it("should filter suppliers by name", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Serengeti");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].name).toBe(
        "Serengeti Safari Co."
      );
    });

    it("should be case-insensitive", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("KILIMANJARO");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].name).toBe(
        "Kilimanjaro Trekking Ltd"
      );
    });

    it("should match partial names", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Elewana");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].name).toBe(
        "Elewana Lodges & Camps"
      );
    });
  });

  describe("Search by Code", () => {
    it("should filter suppliers by code", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("KTL-003");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].code).toBe("KTL-003");
    });

    it("should match partial code", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("SSC");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].code).toBe("SSC-002");
    });
  });

  describe("Search by Email", () => {
    it("should filter suppliers by email", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("treks@kilimanjaroltd");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].email).toBe(
        "treks@kilimanjaroltd.com"
      );
    });
  });

  describe("Search by Phone", () => {
    it("should filter suppliers by phone number", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("345 678");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].phone).toBe(
        "+255 345 678 901"
      );
    });
  });

  describe("No Results", () => {
    it("should return empty results for non-matching query", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("xyznonexistent");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(0);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Clear Search", () => {
    it("should return all suppliers when search is cleared", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Elewana");
      });
      advanceDebounce();
      expect(result.current.filteredSuppliers).toHaveLength(1);

      act(() => {
        result.current.setSearchQuery("");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(3);
      expect(result.current.hasResults).toBe(true);
    });
  });

  describe("Debouncing", () => {
    it("should not filter until debounce delay has passed", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Elewana");
      });

      expect(result.current.searchQuery).toBe("Elewana");
      expect(result.current.filteredSuppliers).toHaveLength(3);

      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
    });
  });

  describe("Whitespace Handling", () => {
    it("should trim whitespace from search query for filtering", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("  Elewana  ");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(1);
    });

    it("should return all suppliers for whitespace-only query", () => {
      const { result } = renderHook(() => useSupplierSearch(mockSuppliers), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("   ");
      });
      advanceDebounce();

      expect(result.current.filteredSuppliers).toHaveLength(3);
    });
  });
});
