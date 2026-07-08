import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Agency } from "@/entities/agency/model/types";
import { createAgency } from "@/entities/agency/testing/factories";

import { useAgencySearch } from "../model/useAgencySearch";

const DEBOUNCE_MS = 300;

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const advanceDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
};

describe("useAgencySearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("State Management", () => {
    it("should initialize with empty search query", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      expect(result.current.searchQuery).toBe("");
    });

    it("should update search query when setSearchQuery is called", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("test");
      });

      expect(result.current.searchQuery).toBe("test");
    });

    it("should update search query multiple times", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("test");
      });
      expect(result.current.searchQuery).toBe("test");

      act(() => {
        result.current.setSearchQuery("agency");
      });
      expect(result.current.searchQuery).toBe("agency");

      act(() => {
        result.current.setSearchQuery("");
      });
      expect(result.current.searchQuery).toBe("");
    });
  });

  describe("Empty Query Handling", () => {
    it("should return all agencies when query is empty string", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One"),
        createAgency("2", "Agency Two"),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      expect(result.current.filteredAgencies).toEqual(agencies);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return all agencies when query is only whitespace", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("   ");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toEqual(agencies);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return empty array when agencies array is empty", () => {
      const agencies: Agency[] = [];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      expect(result.current.filteredAgencies).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it("should return empty array and hasResults false when no agencies", () => {
      const agencies: Agency[] = [];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("test");
      });

      expect(result.current.filteredAgencies).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Name Matching", () => {
    it("should match agency by exact name (case-insensitive)", () => {
      const agencies: Agency[] = [
        createAgency("1", "Kilimanjaro Experts"),
        createAgency("2", "Serengeti Adventures"),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("kilimanjaro");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
      expect(result.current.hasResults).toBe(true);
    });

    it("should match agency by partial name", () => {
      const agencies: Agency[] = [
        createAgency("1", "Kilimanjaro Experts"),
        createAgency("2", "Serengeti Adventures"),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("kili");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });

    it("should match multiple agencies by name", () => {
      const agencies: Agency[] = [
        createAgency("1", "Africa Tours"),
        createAgency("2", "Africa Treks"),
        createAgency("3", "Serengeti Adventures"),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("africa");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(2);
      expect(result.current.filteredAgencies[0].id).toBe("1");
      expect(result.current.filteredAgencies[1].id).toBe("2");
    });

    it("should handle case-insensitive matching", () => {
      const agencies: Agency[] = [createAgency("1", "Kilimanjaro Experts")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("KILIMANJARO");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });
  });

  describe("Agency Group Matching", () => {
    it("should match agency by agency group", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { agencyGroupName: "AAConsultants" }),
        createAgency("2", "Agency Two", { agencyGroupName: "CPSRack" }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("AAConsultants");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });

    it("should match agency by partial agency group", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { agencyGroupName: "AAConsultants" }),
        createAgency("2", "Agency Two", { agencyGroupName: "CPSRack" }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("consul");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });

    it("should match agency by any assigned agency group", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          agencyGroupIds: ["ag-1", "ag-2"],
          agencyGroups: [
            { id: "ag-1", name: "AAConsultants" },
            { id: "ag-2", name: "Private Journeys" },
          ],
        }),
        createAgency("2", "Agency Two", { agencyGroupName: "CPSRack" }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("private");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });
  });

  describe("Source Market Matching", () => {
    it("should match agency by source market", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { sourceMarketId: "FIT" }),
        createAgency("2", "Agency Two", { sourceMarketId: "GBR" }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("GBR");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("2");
    });

    it("should match multiple agencies with same source market", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { sourceMarketId: "FIT" }),
        createAgency("2", "Agency Two", { sourceMarketId: "FIT" }),
        createAgency("3", "Agency Three", { sourceMarketId: "UK" }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("FIT");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(2);
    });
  });

  describe("Safari Planner Matching", () => {
    it("should match agency by assigned safari planner", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          assignedSafariPlannerName: "Erik Karlsson",
        }),
        createAgency("2", "Agency Two", {
          assignedSafariPlannerName: "Amelia Earhart",
        }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("erik");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });

    it("should match by partial safari planner name", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          assignedSafariPlannerName: "Erik Karlsson",
        }),
        createAgency("2", "Agency Two", {
          assignedSafariPlannerName: "Amelia Earhart",
        }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("karl");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
      expect(result.current.filteredAgencies[0].id).toBe("1");
    });
  });

  describe("hasResults", () => {
    it("should return true when results exist", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("test");
      });
      advanceDebounce();

      expect(result.current.hasResults).toBe(true);
    });

    it("should return false when no results", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("nonexistent");
      });
      advanceDebounce();

      expect(result.current.hasResults).toBe(false);
    });

    it("should update correctly when query changes", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("test");
      });
      advanceDebounce();
      expect(result.current.hasResults).toBe(true);

      act(() => {
        result.current.setSearchQuery("nonexistent");
      });
      advanceDebounce();
      expect(result.current.hasResults).toBe(false);

      act(() => {
        result.current.setSearchQuery("");
      });
      advanceDebounce();
      expect(result.current.hasResults).toBe(true);
    });

    it("should return false for empty agencies array", () => {
      const agencies: Agency[] = [];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in search query", () => {
      const agencies: Agency[] = [createAgency("1", "Test & More Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("& M");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
    });

    it("should handle very long search queries", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      const longQuery = "a".repeat(1000);
      act(() => {
        result.current.setSearchQuery(longQuery);
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toEqual([]);
    });

    it("should trim whitespace from query", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("  test  ");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(1);
    });

    it("should handle agencies with same name but different IDs", () => {
      const agencies: Agency[] = [
        createAgency("1", "Safari Tours"),
        createAgency("2", "Safari Tours"),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("safari");
      });
      advanceDebounce();

      expect(result.current.filteredAgencies).toHaveLength(2);
    });
  });

  describe("Cross-field Search", () => {
    it("should match agency when query matches any searchable field", () => {
      const agencies: Agency[] = [
        createAgency("1", "Test Agency", {
          agencyGroupId: "UniqueGroup",
          agencyGroupName: "UniqueGroup",
          sourceMarketId: "UK",
          assignedSafariPlannerName: "John Doe",
        }),
      ];

      const { result } = renderHook(() => useAgencySearch(agencies), {
        wrapper,
      });

      // Match by name
      act(() => {
        result.current.setSearchQuery("test");
      });
      advanceDebounce();
      expect(result.current.filteredAgencies).toHaveLength(1);

      // Match by agency group
      act(() => {
        result.current.setSearchQuery("unique");
      });
      advanceDebounce();
      expect(result.current.filteredAgencies).toHaveLength(1);

      // Match by safari planner
      act(() => {
        result.current.setSearchQuery("john");
      });
      advanceDebounce();
      expect(result.current.filteredAgencies).toHaveLength(1);
    });
  });
});
