import { useMemo, useState } from "react";

import type { AgencyGroup } from "@/entities/agency-group/model/types";
import type { SortDirection } from "@/shared/components/Table";

export type SortKey = "name" | "agencyCount" | "isActive" | null;

export interface SortState {
  field: SortKey;
  direction: SortDirection;
}

export function useAgencyGroupsListSort(agencyGroups: AgencyGroup[]) {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const onSort = (key: SortKey | null, direction: SortDirection) => {
    setSortKey(key as SortKey);
    setSortDirection(direction);
  };

  const sortedAgencyGroups = useMemo(() => {
    if (!sortKey) return agencyGroups;
    const sorted = [...agencyGroups].sort((a, b) => {
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortKey === "agencyCount") {
        return a.numberOfAgencies - b.numberOfAgencies;
      }
      if (sortKey === "isActive") {
        return (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
      }
      return 0;
    });
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [agencyGroups, sortKey, sortDirection]);

  return {
    sortState: { field: sortKey, direction: sortDirection },
    sortKey,
    sortDirection,
    onSort,
    sortedAgencyGroups,
  };
}
