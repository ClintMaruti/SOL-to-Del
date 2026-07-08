import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AgencyGroup } from "@/entities/agency-group/model/types";

import { useAgencyGroupsListSort } from "../model/useAgencyGroupsListSort";

function createAgencyGroup(
  id: string,
  name: string,
  options?: { numberOfAgencies?: number; isActive?: boolean }
): AgencyGroup {
  return {
    id,
    name,
    description: null,
    numberOfAgencies: options?.numberOfAgencies ?? 0,
    isActive: options?.isActive ?? true,
    version: 0,
  };
}

describe("useAgencyGroupsListSort", () => {
  describe("Initial State", () => {
    it("should initialize with null field and asc direction", () => {
      const groups: AgencyGroup[] = [createAgencyGroup("1", "Test Group")];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      expect(result.current.sortState.field).toBeNull();
      expect(result.current.sortState.direction).toBe("asc");
    });

    it("should return unsorted groups when no sort is applied", () => {
      const groups: AgencyGroup[] = [
        createAgencyGroup("1", "Zebra"),
        createAgencyGroup("2", "Alpha"),
        createAgencyGroup("3", "Beta"),
      ];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      expect(result.current.sortedAgencyGroups).toEqual(groups);
    });
  });

  describe("onSort", () => {
    it("should set sort field and direction when onSort is called", () => {
      const groups: AgencyGroup[] = [createAgencyGroup("1", "Test Group")];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("name", "asc");
      });

      expect(result.current.sortState.field).toBe("name");
      expect(result.current.sortState.direction).toBe("asc");
    });

    it("should update direction when onSort is called with desc", () => {
      const groups: AgencyGroup[] = [createAgencyGroup("1", "Test Group")];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("name", "desc");
      });

      expect(result.current.sortState.field).toBe("name");
      expect(result.current.sortState.direction).toBe("desc");
    });
  });

  describe("Sorting by Name", () => {
    it("should sort groups by name ascending", () => {
      const groups: AgencyGroup[] = [
        createAgencyGroup("1", "Zebra"),
        createAgencyGroup("2", "Alpha"),
        createAgencyGroup("3", "Beta"),
      ];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("name", "asc");
      });

      expect(result.current.sortedAgencyGroups[0].name).toBe("Alpha");
      expect(result.current.sortedAgencyGroups[1].name).toBe("Beta");
      expect(result.current.sortedAgencyGroups[2].name).toBe("Zebra");
    });

    it("should sort groups by name descending", () => {
      const groups: AgencyGroup[] = [
        createAgencyGroup("1", "Alpha"),
        createAgencyGroup("2", "Beta"),
        createAgencyGroup("3", "Zebra"),
      ];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("name", "desc");
      });

      expect(result.current.sortedAgencyGroups[0].name).toBe("Zebra");
      expect(result.current.sortedAgencyGroups[1].name).toBe("Beta");
      expect(result.current.sortedAgencyGroups[2].name).toBe("Alpha");
    });
  });

  describe("Sorting by agencyCount", () => {
    it("should sort groups by agencyCount ascending", () => {
      const groups: AgencyGroup[] = [
        createAgencyGroup("1", "A", { numberOfAgencies: 10 }),
        createAgencyGroup("2", "B", { numberOfAgencies: 2 }),
        createAgencyGroup("3", "C", { numberOfAgencies: 5 }),
      ];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("agencyCount", "asc");
      });

      expect(result.current.sortedAgencyGroups[0].numberOfAgencies).toBe(2);
      expect(result.current.sortedAgencyGroups[1].numberOfAgencies).toBe(5);
      expect(result.current.sortedAgencyGroups[2].numberOfAgencies).toBe(10);
    });

    it("should sort groups by agencyCount descending", () => {
      const groups: AgencyGroup[] = [
        createAgencyGroup("1", "A", { numberOfAgencies: 2 }),
        createAgencyGroup("2", "B", { numberOfAgencies: 10 }),
        createAgencyGroup("3", "C", { numberOfAgencies: 5 }),
      ];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("agencyCount", "desc");
      });

      expect(result.current.sortedAgencyGroups[0].numberOfAgencies).toBe(10);
      expect(result.current.sortedAgencyGroups[1].numberOfAgencies).toBe(5);
      expect(result.current.sortedAgencyGroups[2].numberOfAgencies).toBe(2);
    });
  });

  describe("Sorting by isActive", () => {
    it("should sort groups by isActive ascending (inactive first)", () => {
      const groups: AgencyGroup[] = [
        createAgencyGroup("1", "A", { isActive: true }),
        createAgencyGroup("2", "B", { isActive: false }),
        createAgencyGroup("3", "C", { isActive: true }),
      ];

      const { result } = renderHook(() => useAgencyGroupsListSort(groups));

      act(() => {
        result.current.onSort("isActive", "asc");
      });

      expect(result.current.sortedAgencyGroups[0].isActive).toBe(false);
      expect(result.current.sortedAgencyGroups[1].isActive).toBe(true);
      expect(result.current.sortedAgencyGroups[2].isActive).toBe(true);
    });
  });
});
