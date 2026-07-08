import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { Agency } from "@/entities/agency/model/types";
import { useClearURLSearchParam, useDebouncedValue } from "@/shared/hooks";
import { agencyGroupNamesSearchText } from "@/shared/lib";

export function useAgencySearch(agencies: Agency[]) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  useClearURLSearchParam("search");

  const filteredAgencies = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();

    if (!query || query.length < 3) {
      return agencies;
    }

    return agencies.filter((agency) => {
      return (
        agency.name.toLowerCase().includes(query) ||
        agencyGroupNamesSearchText(agency.agencyGroups)
          .toLowerCase()
          .includes(query) ||
        (agency.sourceMarketId ?? "").toLowerCase().includes(query) ||
        (agency.assignedSafariPlannerName ?? "")
          .toLowerCase()
          .includes(query) ||
        (agency.sourceMarketName ?? "").toLowerCase().includes(query)
      );
    });
  }, [agencies, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredAgencies,
    hasResults: filteredAgencies.length > 0,
  };
}
