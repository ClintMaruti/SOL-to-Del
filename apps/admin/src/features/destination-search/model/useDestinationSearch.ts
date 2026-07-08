import { useMemo, useState } from "react";

import type { Destination } from "@/entities/destination/model/types";
import { useDebouncedValue } from "@/shared/hooks";

export function useDestinationSearch(destinations: Destination[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const filteredDestinations = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();

    if (!query || query.length < 3) {
      return destinations;
    }

    const filterDestination = (dest: Destination): Destination | null => {
      const matchesQuery =
        dest.name.toLowerCase().includes(query) ||
        dest.code?.toLowerCase().includes(query) ||
        (dest.coordinates &&
          `${dest.coordinates.lat}, ${dest.coordinates.lng}`.includes(query));

      const filteredChildren =
        dest.children
          ?.map(filterDestination)
          .filter((d): d is Destination => d !== null) ?? [];

      // Include destination if it matches or has matching children
      if (matchesQuery || filteredChildren.length > 0) {
        return {
          ...dest,
          children:
            filteredChildren.length > 0 ? filteredChildren : dest.children,
        };
      }

      return null;
    };

    return destinations
      .map(filterDestination)
      .filter((d): d is Destination => d !== null);
  }, [destinations, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredDestinations,
    hasResults: filteredDestinations.length > 0,
  };
}
