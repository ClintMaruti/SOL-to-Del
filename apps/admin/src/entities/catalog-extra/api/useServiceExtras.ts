import { api, useQuery } from "@sol/api-client";

import { normalizeCatalogExtraListItem } from "../lib/normalizeCatalogExtraListItem";
import type { CatalogExtra } from "../model/types";

export function useServiceExtras(serviceId: string | null) {
  return useQuery<CatalogExtra[]>({
    queryKey: ["catalog-extras", "service", serviceId],
    queryFn: async () => {
      const data = await api.get<unknown[]>(
        `/catalog/services/${serviceId}/extras`
      );
      return Array.isArray(data) ? data.map(normalizeCatalogExtraListItem) : [];
    },
    enabled: Boolean(serviceId),
  });
}
