import { api, useQuery } from "@sol/api-client";

import { buildDestinationTree } from "../lib/destination-utils";
import type { DestinationApiItem } from "../model/api-types";
import type { Destination } from "../model/types";

import { transformApiItemToDestination } from "./useDestinations";

/**
 * Catalog locations eligible for itinerary destinations: active countries with ≥1 active
 * supplier (server-side filter). Same tree shape as {@link useDestinations}.
 */
export function useEligibleDestinations() {
  return useQuery<Destination[]>({
    queryKey: ["destinations", "eligible"],
    queryFn: async () => {
      const apiData = await api.get<DestinationApiItem[] | null | undefined>(
        "/catalog/locations/eligible"
      );

      const items = Array.isArray(apiData) ? apiData.reverse() : [];

      const transformedItems = items.map((item) => ({
        ...transformApiItemToDestination(item),
        parentId: item.parentId,
      }));

      return buildDestinationTree(transformedItems);
    },
  });
}
