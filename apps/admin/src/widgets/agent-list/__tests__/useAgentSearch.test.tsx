import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAgent } from "@/entities/agent/testing/factories";

import { useAgentSearch } from "../model/useAgentSearch";

const DEBOUNCE_MS = 300;

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const advanceDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
};

const mockAgents = [
  createAgent("agent-1", "Gugu", "Mbatha-Raw", {
    primaryEmail: "erik.karlsson@safari.com",
    phoneNumber: "+1 23-555-901-2345",
    agencyName: "Kilimanjaro Experts",
    assignedSafariPlannerId: "sp-1",
    assignedSafariPlannerName: "Erik Karlsson",
  }),
  createAgent("agent-2", "Jomo", "Kenyatta", {
    primaryEmail: "a.earhart@safari.com",
    phoneNumber: "+1 23-555-890-1234",
    agencyName: "Serengeti Adventures",
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
  }),
  createAgent("agent-3", "Jonathan", "Annan", {
    primaryEmail: "a.earhart@adventure.com",
    phoneNumber: "+1 23-555-789-0123",
    agencyName: "Africa Tours",
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
  }),
];

function fullName(agent: (typeof mockAgents)[0]): string {
  return `${agent.firstName} ${agent.lastName}`;
}

describe("useAgentSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial State", () => {
    it("should return all agents when search query is empty", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      expect(result.current.searchQuery).toBe("");
      expect(result.current.filteredAgents).toHaveLength(3);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return empty results for empty agents array", () => {
      const { result } = renderHook(() => useAgentSearch([]), { wrapper });

      expect(result.current.filteredAgents).toHaveLength(0);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Search by Name", () => {
    it("should filter agents by name", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Gugu");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(fullName(result.current.filteredAgents[0])).toBe(
        "Gugu Mbatha-Raw"
      );
    });

    it("should be case-insensitive", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("GUGU");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(fullName(result.current.filteredAgents[0])).toBe(
        "Gugu Mbatha-Raw"
      );
    });

    it("should match partial names", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Ken");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(fullName(result.current.filteredAgents[0])).toBe("Jomo Kenyatta");
    });
  });

  describe("Search by Agency Name", () => {
    it("should filter agents by agency name", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Kilimanjaro");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(result.current.filteredAgents[0].agencyName).toBe(
        "Kilimanjaro Experts"
      );
    });
  });

  describe("Search by Agency Group", () => {
    it("should filter agents by any assigned agency group", () => {
      const agents = [
        createAgent("agent-1", "Amina", "Diallo", {
          agencyGroups: [
            { id: "ag-1", name: "AAConsultants" },
            { id: "ag-2", name: "Private Journeys" },
          ],
        }),
        createAgent("agent-2", "Kofi", "Mensah", {
          agencyGroups: [{ id: "ag-3", name: "CPSRack" }],
        }),
      ];

      const { result } = renderHook(() => useAgentSearch(agents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("private");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(result.current.filteredAgents[0].id).toBe("agent-1");
    });
  });

  describe("Search by Email", () => {
    it("should filter agents by email", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("erik.karlsson");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(result.current.filteredAgents[0].primaryEmail).toBe(
        "erik.karlsson@safari.com"
      );
    });
  });

  describe("Search by Phone", () => {
    it("should filter agents by phone number", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("901-2345");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(fullName(result.current.filteredAgents[0])).toBe(
        "Gugu Mbatha-Raw"
      );
    });
  });

  describe("Search by Safari Planner", () => {
    it("should filter agents by assigned safari planner name", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("amelia");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(2);
    });

    it("should filter to single result for unique planner name", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Erik Karlsson");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
      expect(result.current.filteredAgents[0].assignedSafariPlannerName).toBe(
        "Erik Karlsson"
      );
    });
  });

  describe("No Results", () => {
    it("should return empty results for non-matching query", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("xyznonexistent");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(0);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Clear Search", () => {
    it("should return all agents when search is cleared", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("Gugu");
      });
      advanceDebounce();
      expect(result.current.filteredAgents).toHaveLength(1);

      act(() => {
        result.current.setSearchQuery("");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(3);
      expect(result.current.hasResults).toBe(true);
    });
  });

  describe("Whitespace Handling", () => {
    it("should trim whitespace from search query", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("  Gugu  ");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(1);
    });

    it("should treat whitespace-only query as empty", () => {
      const { result } = renderHook(() => useAgentSearch(mockAgents), {
        wrapper,
      });

      act(() => {
        result.current.setSearchQuery("   ");
      });
      advanceDebounce();

      expect(result.current.filteredAgents).toHaveLength(3);
    });
  });
});
