import { api, useQuery } from "@sol/api-client";

import type { SupplierHeadOfficeApiResponse } from "../model/api-types";
import type { SupplierHeadOffice } from "../model/types";

export function useSupplierHeadOffices() {
  return useQuery<SupplierHeadOffice[]>({
    queryKey: ["supplier-head-offices"],
    queryFn: async () => {
      const data = await api.get<SupplierHeadOfficeApiResponse[]>(
        "/catalog/head-offices"
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
