import { api, useQuery } from "@sol/api-client";

import { normalizeCatalogExtraListItem } from "../lib/normalizeCatalogExtraListItem";
import type { CatalogExtra } from "../model/types";

export function useSupplierExtras(supplierId: string | null) {
  return useQuery<CatalogExtra[]>({
    queryKey: ["catalog-extras", "supplier", supplierId],
    queryFn: async () => {
      const data = await api.get<unknown[]>(
        `/catalog/suppliers/${supplierId}/extras`
      );
      return Array.isArray(data) ? data.map(normalizeCatalogExtraListItem) : [];
    },
    enabled: Boolean(supplierId),
  });
}
