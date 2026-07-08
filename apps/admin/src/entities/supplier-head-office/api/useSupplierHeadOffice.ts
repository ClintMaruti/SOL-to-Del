import { api, useQuery } from "@sol/api-client";

import type { SupplierHeadOfficeApiResponse } from "../model/api-types";
import type { SupplierHeadOffice } from "../model/types";

/**
 * Hook to fetch a single supplier head office by ID
 * @param id - Supplier head office identifier (GUID or long)
 * @returns Query result with SupplierHeadOffice or null
 */
export function useSupplierHeadOffice(id: string | null) {
  return useQuery<SupplierHeadOffice | null>({
    queryKey: ["supplier-head-office", id],
    queryFn: async () => {
      if (!id) return null;

      const data = await api.get<SupplierHeadOfficeApiResponse>(
        `/catalog/head-offices/${id}`
      );
      return data;
    },
    enabled: Boolean(id),
  });
}
