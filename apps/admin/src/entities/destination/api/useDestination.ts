import { api, useQuery } from "@sol/api-client";

import type { DestinationApiItem } from "../model/api-types";

export function useDestination(id: string | null) {
  return useQuery<DestinationApiItem | null>({
    queryKey: ["destination", id],
    queryFn: async () => {
      if (!id) return null;

      const data = await api.get<DestinationApiItem>(
        `/catalog/locations/${encodeURIComponent(id)}`
      );

      return data;
    },
    enabled: !!id,
  });
}
