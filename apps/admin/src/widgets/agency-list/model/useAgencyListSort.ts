import { useMemo, useState } from "react";

import type { Agency } from "@/entities/agency/model/types";
import { formatAgencyGroupNames } from "@/shared/lib";

export type SortField =
  | "name"
  | "agentsCount"
  | "agencyGroup"
  | "sourceMarket"
  | "assignedSafariPlannerName"
  | "status";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export function useAgencyListSort(agencies: Agency[]) {
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

  const sortedAgencies = useMemo(() => {
    if (!sortState.field) return agencies;

    return [...agencies].sort((a, b) => {
      const field = sortState.field!;
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "agencyGroup":
          aValue = formatAgencyGroupNames(a.agencyGroups).toLowerCase();
          bValue = formatAgencyGroupNames(b.agencyGroups).toLowerCase();
          break;
        case "sourceMarket":
          aValue = (a.sourceMarketId ?? "").toLowerCase();
          bValue = (b.sourceMarketId ?? "").toLowerCase();
          break;
        case "assignedSafariPlannerName":
          aValue = (a.assignedSafariPlannerName ?? "").toLowerCase();
          bValue = (b.assignedSafariPlannerName ?? "").toLowerCase();
          break;
        case "agentsCount":
          aValue = a.agentsCount ?? 0;
          bValue = b.agentsCount ?? 0;
          break;
        case "status":
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
  }, [agencies, sortState]);

  return {
    sortState,
    toggleSort,
    sortedAgencies,
  };
}
