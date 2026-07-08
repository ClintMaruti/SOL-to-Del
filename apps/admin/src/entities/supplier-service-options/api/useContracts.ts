import { api, useQuery } from "@sol/api-client";

import type { Contract } from "../model/types";

/**
 * Lists contracts for a supplier (GET /catalog/suppliers/:supplierId/contracts).
 * Catalog API does not expose GET .../services/:serviceId/contracts.
 */
export function useContracts(supplierId: string | null) {
  return useQuery<Contract[]>({
    queryKey: ["supplier-contracts", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const data = await api.get<Contract[]>(
        `/catalog/suppliers/${supplierId}/contracts`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(supplierId),
  });
}
