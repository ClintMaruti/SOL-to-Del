import { api, useQuery } from "@sol/api-client";

import { buildDestinationTree } from "../lib/destination-utils";
import type { DestinationApiItem } from "../model/api-types";
import type { Destination } from "../model/types";

/**
 * Transforms API response item to frontend Destination format
 */
export function transformApiItemToDestination(
  apiItem: DestinationApiItem
): Omit<Destination, "children"> {
  return {
    id: apiItem.id,
    name: apiItem.name,
    type: apiItem.type,
    code: apiItem.code || undefined,
    status: apiItem.isActive ? "Active" : "Inactive",
    ...(typeof apiItem.isPreferred === "boolean"
      ? { isPreferred: apiItem.isPreferred }
      : {}),
    ...(apiItem.latitude !== null &&
    apiItem.longitude !== null &&
    apiItem.latitude !== undefined &&
    apiItem.longitude !== undefined
      ? {
          coordinates: {
            lat: apiItem.latitude,
            lng: apiItem.longitude,
          },
        }
      : {}),
  };
}

export function useDestinations() {
  return useQuery<Destination[]>({
    queryKey: ["destinations"],
    queryFn: async () => {
      // API returns direct array (no wrapper), or 204 No Content (empty body)
      const apiData = await api.get<DestinationApiItem[] | null | undefined>(
        "/catalog/locations"
      );

      // Handle 204 No Content or empty response: treat as empty array
      const items = Array.isArray(apiData) ? apiData.reverse() : [];

      // Transform API items to frontend format with parentId
      const transformedItems = items.map((item) => ({
        ...transformApiItemToDestination(item),
        parentId: item.parentId, // Keep parentId for tree building
      }));

      // Transform flat structure to hierarchical tree
      return buildDestinationTree(transformedItems);
    },
  });
}
