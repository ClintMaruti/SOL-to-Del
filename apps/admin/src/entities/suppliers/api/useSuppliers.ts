import { api, useQuery } from "@sol/api-client";

import type { Supplier } from "../model/types";

/**
 * List suppliers. When `headOfficeId` is set, calls GET /catalog/suppliers?headOfficeId=...
 * (same pattern as agencies with agencyGroupId).
 */
export function useSuppliers(headOfficeId?: string | null) {
  return useQuery<Supplier[]>({
    queryKey: headOfficeId
      ? (["suppliers", headOfficeId] as const)
      : (["suppliers"] as const),
    queryFn: async () => {
      const data = await api.get<Supplier[]>(
        `/catalog/suppliers${headOfficeId ? `?headOfficeId=${headOfficeId}` : ""}`
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
