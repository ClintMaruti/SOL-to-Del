import { api, useQuery } from "@sol/api-client";

import type { SupplierContract } from "../model/types";

export function useSupplierContracts(supplierId: string | null) {
  return useQuery<SupplierContract[]>({
    queryKey: ["supplier-contracts", supplierId],
    queryFn: async () => {
      const data = await api.get<SupplierContract[]>(
        `/catalog/suppliers/${supplierId}/contracts`
      );

      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(supplierId),
  });
}
