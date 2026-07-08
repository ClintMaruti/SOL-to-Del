import { useMemo, useState } from "react";

import type { Agent } from "@/entities/agent/model/types";
import { formatAgencyGroupNames } from "@/shared/lib";

export type SortField =
  | "firstName"
  | "lastName"
  | "agencyName"
  | "agencyGroup"
  | "primaryEmail"
  | "phoneNumber"
  | "assignedSafariPlannerName"
  | "isActive";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export function useAgentListSort(agents: Agent[]) {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });

  const toggleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        // Toggle direction if same field
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // New field, start with ascending
      return { field, direction: "asc" };
    });
  };

  const sortedAgents = useMemo(() => {
    if (!sortState.field) return agents;

    return [...agents].sort((a, b) => {
      const field = sortState.field!;
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case "firstName":
        case "lastName":
        case "primaryEmail":
        case "phoneNumber":
        case "assignedSafariPlannerName":
          aValue = (a[field] ?? "").toString().toLowerCase();
          bValue = (b[field] ?? "").toString().toLowerCase();
          break;
        case "agencyName":
          aValue = (a.agencyName || "").toLowerCase();
          bValue = (b.agencyName || "").toLowerCase();
          break;
        case "agencyGroup":
          aValue = formatAgencyGroupNames(a.agencyGroups).toLowerCase();
          bValue = formatAgencyGroupNames(b.agencyGroups).toLowerCase();
          break;
        case "isActive":
          aValue = a.isActive ? 0 : 1;
          bValue = b.isActive ? 0 : 1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortState.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [agents, sortState]);

  return {
    sortState,
    toggleSort,
    sortedAgents,
  };
}
