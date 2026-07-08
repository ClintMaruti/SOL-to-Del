import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgencyGroup } from "@/entities/agency-group/model/types";

import { useAgencyGroupSearch } from "../model/useAgencyGroupSearch";

const DEBOUNCE_MS = 300;

function createAgencyGroup(
  id: string,
  name: string,
  options?: {
    description?: string | null;
    numberOfAgencies?: number;
    isActive?: boolean;
  }
): AgencyGroup {
  return {
    id,
    name,
    description: options?.description ?? null,
    numberOfAgencies: options?.numberOfAgencies ?? 0,
    isActive: options?.isActive ?? true,
    version: 0,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const advanceDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
};

describe("useAgencyGroupSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("State Management", () => {
    it("should initialize with empty search query", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      expect(result.current.searchQuery).toBe("");
    });

    it("should update search query when setSearchQuery is called", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("AAC");
      });

      expect(result.current.searchQuery).toBe("AAC");
    });
  });

  describe("Empty Query Handling", () => {
    it("should return all agency groups when query is empty", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      expect(result.current.filteredAgencyGroups).toEqual(agencyGroups);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return empty array when agency groups array is empty", () => {
      const agencyGroups: AgencyGroup[] = [];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      expect(result.current.filteredAgencyGroups).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it("should return all when query is only whitespace", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("   ");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toEqual(agencyGroups);
      expect(result.current.hasResults).toBe(true);
    });
  });

  describe("Minimum query length (3 characters)", () => {
    it("should return all agency groups when query has fewer than 3 characters", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("AA");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toHaveLength(2);
    });

    it("should filter when query has 3 or more characters", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("AAC");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toHaveLength(1);
      expect(result.current.filteredAgencyGroups[0].id).toBe("ag-1");
    });
  });

  describe("Name Matching", () => {
    it("should match agency group by exact name (case-insensitive)", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("aaconsultants");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toHaveLength(1);
      expect(result.current.filteredAgencyGroups[0].id).toBe("ag-1");
      expect(result.current.hasResults).toBe(true);
    });

    it("should match agency group by partial name", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Angama");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toHaveLength(1);
      expect(result.current.filteredAgencyGroups[0].name).toBe("AngamaSpecial");
    });

    it("should return empty array when no name matches", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("ZooGroup");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Description Matching", () => {
    it("should match agency group by description", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants", {
          description: "Internal group",
        }),
        createAgencyGroup("ag-2", "AngamaSpecial", {
          description: "Wholesale group",
        }),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Internal");
      });
      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toHaveLength(1);
      expect(result.current.filteredAgencyGroups[0].id).toBe("ag-1");
    });
  });

  describe("hasResults", () => {
    it("should return true when results exist", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("AAC");
      });
      advanceDebounce();

      expect(result.current.hasResults).toBe(true);
    });

    it("should return false when no results", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("xyz");
      });
      advanceDebounce();

      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Debouncing", () => {
    it("should not filter until debounce delay has passed", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      const { result } = renderHook(() => useAgencyGroupSearch(agencyGroups), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Angama");
      });

      expect(result.current.searchQuery).toBe("Angama");
      expect(result.current.filteredAgencyGroups).toHaveLength(2);

      advanceDebounce();

      expect(result.current.filteredAgencyGroups).toHaveLength(1);
    });
  });
});
