import { api, useQuery } from "@sol/api-client";

import type { SupplierService } from "../types";

export function useSupplierServices(supplierId: string | null) {
  return useQuery<SupplierService[]>({
    queryKey: ["supplier-services", supplierId],
    queryFn: async () => {
      const data = await api.get<SupplierService[]>(
        `/catalog/suppliers/${supplierId}/services`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(supplierId),
  });
}
