import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Agency } from "@/entities/agency/model/types";
import { createAgency } from "@/entities/agency/testing/factories";

import { useAgencyListSort } from "../model/useAgencyListSort";

describe("useAgencyListSort", () => {
  describe("Initial State", () => {
    it("should initialize with null field and asc direction", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      expect(result.current.sortState.field).toBeNull();
      expect(result.current.sortState.direction).toBe("asc");
    });

    it("should return unsorted agencies when no sort is applied", () => {
      const agencies: Agency[] = [
        createAgency("1", "Zebra Tours"),
        createAgency("2", "Alpha Tours"),
        createAgency("3", "Beta Tours"),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      expect(result.current.sortedAgencies).toEqual(agencies);
    });
  });

  describe("toggleSort", () => {
    it("should set sort field and direction to asc on first click", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortState.field).toBe("name");
      expect(result.current.sortState.direction).toBe("asc");
    });

    it("should toggle direction to desc on second click of same field", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });
      expect(result.current.sortState.direction).toBe("asc");

      act(() => {
        result.current.toggleSort("name");
      });
      expect(result.current.sortState.direction).toBe("desc");
    });

    it("should toggle back to asc on third click of same field", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });
      act(() => {
        result.current.toggleSort("name");
      });
      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortState.direction).toBe("asc");
    });

    it("should reset to asc when switching to different field", () => {
      const agencies: Agency[] = [createAgency("1", "Test Agency")];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });
      act(() => {
        result.current.toggleSort("name"); // now desc
      });

      act(() => {
        result.current.toggleSort("agencyGroup"); // new field
      });

      expect(result.current.sortState.field).toBe("agencyGroup");
      expect(result.current.sortState.direction).toBe("asc");
    });
  });

  describe("Sorting by Name", () => {
    it("should sort agencies by name ascending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Zebra Tours"),
        createAgency("2", "Alpha Tours"),
        createAgency("3", "Beta Tours"),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortedAgencies[0].name).toBe("Alpha Tours");
      expect(result.current.sortedAgencies[1].name).toBe("Beta Tours");
      expect(result.current.sortedAgencies[2].name).toBe("Zebra Tours");
    });

    it("should sort agencies by name descending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Alpha Tours"),
        createAgency("2", "Beta Tours"),
        createAgency("3", "Zebra Tours"),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });
      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortedAgencies[0].name).toBe("Zebra Tours");
      expect(result.current.sortedAgencies[1].name).toBe("Beta Tours");
      expect(result.current.sortedAgencies[2].name).toBe("Alpha Tours");
    });

    it("should handle case-insensitive name sorting", () => {
      const agencies: Agency[] = [
        createAgency("1", "zebra Tours"),
        createAgency("2", "Alpha Tours"),
        createAgency("3", "beta Tours"),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortedAgencies[0].name).toBe("Alpha Tours");
      expect(result.current.sortedAgencies[1].name).toBe("beta Tours");
      expect(result.current.sortedAgencies[2].name).toBe("zebra Tours");
    });
  });

  describe("Sorting by Agents Count", () => {
    it("should sort agencies by agents count ascending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { agentsCount: 10 }),
        createAgency("2", "Agency Two", { agentsCount: 2 }),
        createAgency("3", "Agency Three", { agentsCount: 5 }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("agentsCount");
      });

      expect(result.current.sortedAgencies[0].agentsCount).toBe(2);
      expect(result.current.sortedAgencies[1].agentsCount).toBe(5);
      expect(result.current.sortedAgencies[2].agentsCount).toBe(10);
    });

    it("should sort agencies by agents count descending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { agentsCount: 2 }),
        createAgency("2", "Agency Two", { agentsCount: 10 }),
        createAgency("3", "Agency Three", { agentsCount: 5 }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("agentsCount");
      });
      act(() => {
        result.current.toggleSort("agentsCount");
      });

      expect(result.current.sortedAgencies[0].agentsCount).toBe(10);
      expect(result.current.sortedAgencies[1].agentsCount).toBe(5);
      expect(result.current.sortedAgencies[2].agentsCount).toBe(2);
    });
  });

  describe("Sorting by Agency Group", () => {
    it("should sort agencies by agency group ascending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          agencyGroupId: "Zebra Group",
          agencyGroupName: "Zebra Group",
        }),
        createAgency("2", "Agency Two", {
          agencyGroupId: "Alpha Group",
          agencyGroupName: "Alpha Group",
        }),
        createAgency("3", "Agency Three", {
          agencyGroupId: "Beta Group",
          agencyGroupName: "Beta Group",
        }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("agencyGroup");
      });

      expect(result.current.sortedAgencies[0].agencyGroupIds).toEqual([
        "Alpha Group",
      ]);
      expect(result.current.sortedAgencies[1].agencyGroupIds).toEqual([
        "Beta Group",
      ]);
      expect(result.current.sortedAgencies[2].agencyGroupIds).toEqual([
        "Zebra Group",
      ]);
    });

    it("should sort agencies by agency group descending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          agencyGroupId: "Alpha Group",
          agencyGroupName: "Alpha Group",
        }),
        createAgency("2", "Agency Two", {
          agencyGroupId: "Beta Group",
          agencyGroupName: "Beta Group",
        }),
        createAgency("3", "Agency Three", {
          agencyGroupId: "Zebra Group",
          agencyGroupName: "Zebra Group",
        }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("agencyGroup");
      });
      act(() => {
        result.current.toggleSort("agencyGroup");
      });

      expect(result.current.sortedAgencies[0].agencyGroupIds).toEqual([
        "Zebra Group",
      ]);
      expect(result.current.sortedAgencies[1].agencyGroupIds).toEqual([
        "Beta Group",
      ]);
      expect(result.current.sortedAgencies[2].agencyGroupIds).toEqual([
        "Alpha Group",
      ]);
    });

    it("should sort agencies by joined group names when multiple groups are assigned", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          agencyGroupIds: ["ag-z", "ag-b"],
          agencyGroups: [
            { id: "ag-z", name: "Zulu Group" },
            { id: "ag-b", name: "Beta Group" },
          ],
        }),
        createAgency("2", "Agency Two", {
          agencyGroupIds: ["ag-a"],
          agencyGroups: [{ id: "ag-a", name: "Alpha Group" }],
        }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("agencyGroup");
      });

      expect(result.current.sortedAgencies.map((agency) => agency.id)).toEqual([
        "2",
        "1",
      ]);
    });
  });

  describe("Sorting by Source Market", () => {
    it("should sort agencies by source market ascending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { sourceMarketId: "uk" }),
        createAgency("2", "Agency Two", { sourceMarketId: "af" }),
        createAgency("3", "Agency Three", { sourceMarketId: "fit" }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("sourceMarket");
      });

      expect(result.current.sortedAgencies[0].sourceMarketId).toBe("af");
      expect(result.current.sortedAgencies[1].sourceMarketId).toBe("fit");
      expect(result.current.sortedAgencies[2].sourceMarketId).toBe("uk");
    });
  });

  describe("Sorting by Assigned Safari Planner", () => {
    it("should sort agencies by assigned safari planner ascending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", {
          assignedSafariPlannerName: "Zara Smith",
        }),
        createAgency("2", "Agency Two", {
          assignedSafariPlannerName: "Anna Johnson",
        }),
        createAgency("3", "Agency Three", {
          assignedSafariPlannerName: "Mike Brown",
        }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("assignedSafariPlannerName");
      });

      expect(result.current.sortedAgencies[0].assignedSafariPlannerName).toBe(
        "Anna Johnson"
      );
      expect(result.current.sortedAgencies[1].assignedSafariPlannerName).toBe(
        "Mike Brown"
      );
      expect(result.current.sortedAgencies[2].assignedSafariPlannerName).toBe(
        "Zara Smith"
      );
    });
  });

  describe("Sorting by Status", () => {
    it("should sort agencies by status with active first when ascending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { isActive: false }),
        createAgency("2", "Agency Two", { isActive: true }),
        createAgency("3", "Agency Three", { isActive: false }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("status");
      });

      expect(result.current.sortedAgencies[0].isActive).toBe(true);
      expect(result.current.sortedAgencies[1].isActive).toBe(false);
      expect(result.current.sortedAgencies[2].isActive).toBe(false);
    });

    it("should sort agencies by status with inactive first when descending", () => {
      const agencies: Agency[] = [
        createAgency("1", "Agency One", { isActive: true }),
        createAgency("2", "Agency Two", { isActive: false }),
        createAgency("3", "Agency Three", { isActive: true }),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("status");
      });
      act(() => {
        result.current.toggleSort("status");
      });

      expect(result.current.sortedAgencies[0].isActive).toBe(false);
      expect(result.current.sortedAgencies[1].isActive).toBe(true);
      expect(result.current.sortedAgencies[2].isActive).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty agencies array", () => {
      const agencies: Agency[] = [];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortedAgencies).toEqual([]);
    });

    it("should handle single agency", () => {
      const agencies: Agency[] = [createAgency("1", "Only Agency")];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortedAgencies).toHaveLength(1);
      expect(result.current.sortedAgencies[0].name).toBe("Only Agency");
    });

    it("should handle agencies with identical values", () => {
      const agencies: Agency[] = [
        createAgency("1", "Same Name"),
        createAgency("2", "Same Name"),
        createAgency("3", "Same Name"),
      ];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(result.current.sortedAgencies).toHaveLength(3);
    });

    it("should not mutate original agencies array", () => {
      const agencies: Agency[] = [
        createAgency("1", "Zebra Tours"),
        createAgency("2", "Alpha Tours"),
      ];
      const originalOrder = [...agencies];

      const { result } = renderHook(() => useAgencyListSort(agencies));

      act(() => {
        result.current.toggleSort("name");
      });

      expect(agencies).toEqual(originalOrder);
    });
  });
});
