import { api, useQuery } from "@sol/api-client";

import {
  mapDetailFromApi,
  type SupplierContentBlockDetail,
  type SupplierContentBlockDetailApi,
} from "../model/types";

export function useSupplierContentBlock(
  supplierId: string | undefined,
  contentBlockId: string | undefined
) {
  return useQuery<SupplierContentBlockDetail>({
    queryKey: ["supplier-content-block", supplierId, contentBlockId],
    queryFn: async () => {
      if (!supplierId || !contentBlockId) {
        throw new Error("supplierId and contentBlockId are required");
      }
      const data = await api.get<SupplierContentBlockDetailApi>(
        `/catalog/suppliers/${supplierId}/content-blocks/${contentBlockId}`
      );
      return mapDetailFromApi(data);
    },
    enabled: Boolean(supplierId) && Boolean(contentBlockId),
  });
}
