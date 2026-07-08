import { api, useQuery } from "@sol/api-client";

import type { SupplierService } from "../types";

export function useSupplierService(serviceId: string | null) {
  return useQuery<SupplierService | null>({
    queryKey: ["supplier-service", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;

      const data = await api.get<SupplierService>(
        `/catalog/services/${serviceId}`
      );
      return data;
    },
    enabled: Boolean(serviceId),
  });
}
