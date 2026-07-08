import { api, useQuery } from "@sol/api-client";

import {
  mapListItemFromApi,
  type SupplierContentBlockListItem,
  type SupplierContentBlockListItemApi,
} from "../model/types";

export function useSupplierContentBlocks(supplierId: string | undefined) {
  return useQuery<SupplierContentBlockListItem[]>({
    queryKey: ["supplier-content-blocks", supplierId],
    queryFn: async () => {
      if (!supplierId) {
        throw new Error("supplierId is required");
      }
      const data = await api.get<SupplierContentBlockListItemApi[]>(
        `/catalog/suppliers/${supplierId}/content-blocks`
      );
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(mapListItemFromApi);
    },
    enabled: Boolean(supplierId),
  });
}
