import { api, useQuery } from "@sol/api-client";

import { normalizeCatalogExtraDetail } from "../lib/normalize-catalog-extra-detail";
import type { CatalogExtraDetail } from "../model/types";

export function useCatalogExtra(extraId: string | null) {
  return useQuery<CatalogExtraDetail>({
    queryKey: ["catalog-extra", extraId],
    queryFn: async () => {
      const data = await api.get<unknown>(`/catalog/extras/${extraId}`);
      return normalizeCatalogExtraDetail(data);
    },
    enabled: Boolean(extraId),
  });
}
