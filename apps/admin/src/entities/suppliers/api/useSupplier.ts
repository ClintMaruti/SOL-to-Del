import { api, useQuery } from "@sol/api-client";

import { normalizeSupplierDetail, type SupplierDetail } from "../model/types";

export function useSupplier(
  supplierId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<SupplierDetail>({
    queryKey: ["suppliers", supplierId],
    queryFn: async (): Promise<SupplierDetail> => {
      const detail = await api.get<SupplierDetail>(
        `/catalog/suppliers/${supplierId}`
      );
      return normalizeSupplierDetail(detail);
    },
    enabled: Boolean(supplierId) && options?.enabled !== false,
  });
}
