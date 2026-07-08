import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createAgent } from "@/entities/agent/testing/factories";

import { useAgentListSort } from "../model/useAgentListSort";

const mockAgents = [
  createAgent("agent-1", "Charlie", "Brown", {
    agencyName: "Zebra Tours",
    primaryEmail: "charlie@test.com",
    phoneNumber: "+1 333-000-0001",
    assignedSafariPlannerId: "sp-3",
    assignedSafariPlannerName: "Zara Smith",
    isActive: true,
  }),
  createAgent("agent-2", "Alice", "Smith", {
    agencyName: "Alpha Tours",
    primaryEmail: "alice@test.com",
    phoneNumber: "+1 111-000-0001",
    assignedSafariPlannerId: "sp-1",
    assignedSafariPlannerName: "Alice Johnson",
    isActive: false,
  }),
  createAgent("agent-3", "Bob", "Jones", {
    agencyName: "Mid Agency",
    primaryEmail: "bob@test.com",
    phoneNumber: "+1 222-000-0001",
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Mike Brown",
    isActive: true,
  }),
];

function fullName(agent: (typeof mockAgents)[0]): string {
  return `${agent.firstName} ${agent.lastName}`;
}

describe("useAgentListSort", () => {
  describe("Initial State", () => {
    it("should return agents unsorted initially", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      expect(result.current.sortState.field).toBeNull();
      expect(result.current.sortState.direction).toBe("asc");
      expect(result.current.sortedAgents).toEqual(mockAgents);
    });
  });

  describe("Sort by Name", () => {
    it("should sort by firstName ascending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("firstName");
      });

      expect(result.current.sortState.field).toBe("firstName");
      expect(result.current.sortState.direction).toBe("asc");
      expect(fullName(result.current.sortedAgents[0])).toBe("Alice Smith");
      expect(fullName(result.current.sortedAgents[1])).toBe("Bob Jones");
      expect(fullName(result.current.sortedAgents[2])).toBe("Charlie Brown");
    });

    it("should sort by firstName descending on second click", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("firstName");
      });
      act(() => {
        result.current.toggleSort("firstName");
      });

      expect(result.current.sortState.direction).toBe("desc");
      expect(fullName(result.current.sortedAgents[0])).toBe("Charlie Brown");
      expect(fullName(result.current.sortedAgents[2])).toBe("Alice Smith");
    });
  });

  describe("Sort by Agency Name", () => {
    it("should sort by agency name ascending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("agencyName");
      });

      expect(result.current.sortedAgents[0].agencyName).toBe("Alpha Tours");
      expect(result.current.sortedAgents[1].agencyName).toBe("Mid Agency");
      expect(result.current.sortedAgents[2].agencyName).toBe("Zebra Tours");
    });
  });

  describe("Sort by Agency Group", () => {
    it("should sort by joined group names ascending", () => {
      const agents = [
        createAgent("agent-1", "Amina", "Diallo", {
          agencyGroups: [
            { id: "ag-z", name: "Zulu Group" },
            { id: "ag-b", name: "Beta Group" },
          ],
        }),
        createAgent("agent-2", "Kofi", "Mensah", {
          agencyGroups: [{ id: "ag-a", name: "Alpha Group" }],
        }),
      ];

      const { result } = renderHook(() => useAgentListSort(agents));

      act(() => {
        result.current.toggleSort("agencyGroup");
      });

      expect(result.current.sortedAgents.map((agent) => agent.id)).toEqual([
        "agent-2",
        "agent-1",
      ]);
    });
  });

  describe("Sort by Email", () => {
    it("should sort by primaryEmail ascending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("primaryEmail");
      });

      expect(result.current.sortedAgents[0].primaryEmail).toBe(
        "alice@test.com"
      );
      expect(result.current.sortedAgents[1].primaryEmail).toBe("bob@test.com");
      expect(result.current.sortedAgents[2].primaryEmail).toBe(
        "charlie@test.com"
      );
    });
  });

  describe("Sort by Phone", () => {
    it("should sort by phoneNumber ascending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("phoneNumber");
      });

      expect(result.current.sortedAgents[0].phoneNumber).toBe(
        "+1 111-000-0001"
      );
      expect(result.current.sortedAgents[1].phoneNumber).toBe(
        "+1 222-000-0001"
      );
      expect(result.current.sortedAgents[2].phoneNumber).toBe(
        "+1 333-000-0001"
      );
    });
  });

  describe("Sort by Assigned Safari Planner", () => {
    it("should sort by assignedSafariPlannerName ascending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("assignedSafariPlannerName");
      });

      expect(result.current.sortedAgents[0].assignedSafariPlannerName).toBe(
        "Alice Johnson"
      );
      expect(result.current.sortedAgents[1].assignedSafariPlannerName).toBe(
        "Mike Brown"
      );
      expect(result.current.sortedAgents[2].assignedSafariPlannerName).toBe(
        "Zara Smith"
      );
    });
  });

  describe("Sort by Active", () => {
    it("should sort active before inactive ascending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("isActive");
      });

      expect(result.current.sortedAgents[0].isActive).toBe(true);
      expect(result.current.sortedAgents[1].isActive).toBe(true);
      expect(result.current.sortedAgents[2].isActive).toBe(false);
    });

    it("should sort inactive before active descending", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("isActive");
      });
      act(() => {
        result.current.toggleSort("isActive");
      });

      expect(result.current.sortedAgents[0].isActive).toBe(false);
    });
  });

  describe("Toggle Direction", () => {
    it("should toggle from asc to desc on same field", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("firstName");
      });

      expect(result.current.sortState.direction).toBe("asc");

      act(() => {
        result.current.toggleSort("firstName");
      });

      expect(result.current.sortState.direction).toBe("desc");
    });

    it("should reset to asc when switching to a new field", () => {
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("firstName");
      });
      act(() => {
        result.current.toggleSort("firstName");
      });

      expect(result.current.sortState.direction).toBe("desc");

      act(() => {
        result.current.toggleSort("primaryEmail");
      });

      expect(result.current.sortState.field).toBe("primaryEmail");
      expect(result.current.sortState.direction).toBe("asc");
    });
  });

  describe("Immutability", () => {
    it("should not mutate the original agents array", () => {
      const originalAgents = [...mockAgents];
      const { result } = renderHook(() => useAgentListSort(mockAgents));

      act(() => {
        result.current.toggleSort("firstName");
      });

      expect(mockAgents).toEqual(originalAgents);
    });
  });
});
