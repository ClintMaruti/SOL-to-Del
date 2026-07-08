import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { AgencyGroup } from "@/entities/agency-group/model/types";
import { useDebouncedValue } from "@/shared/hooks";

export function useAgencyGroupSearch(agencyGroups: AgencyGroup[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchParams(
        (prev) => {
          if (query.trim()) {
            prev.set("search", query);
          } else {
            prev.delete("search");
          }
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const filteredAgencyGroups = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();

    if (!query || query.length < 3) {
      return agencyGroups;
    }

    return agencyGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        (g.description?.toLowerCase().includes(query) ?? false)
    );
  }, [agencyGroups, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredAgencyGroups,
    hasResults: filteredAgencyGroups.length > 0,
  };
}
