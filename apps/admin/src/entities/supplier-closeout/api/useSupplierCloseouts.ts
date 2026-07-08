import { api, useQuery } from "@sol/api-client";

import {
  normalizeSupplierCloseout,
  type SupplierCloseout,
  type SupplierCloseoutDto,
} from "../model/types";

import { supplierCloseoutsQueryKey } from "./queryKeys";

export function useSupplierCloseouts(
  supplierId: string | null | undefined,
  serviceId?: string | null
) {
  return useQuery<SupplierCloseout[]>({
    queryKey: supplierCloseoutsQueryKey(supplierId, serviceId),
    queryFn: async () => {
      if (!supplierId) return [];
      const params = serviceId
        ? `?serviceId=${encodeURIComponent(serviceId)}`
        : "";
      const data = await api.get<SupplierCloseoutDto[]>(
        `/catalog/suppliers/${supplierId}/closeouts${params}`
      );
      return Array.isArray(data) ? data.map(normalizeSupplierCloseout) : [];
    },
    enabled: Boolean(supplierId),
  });
}
