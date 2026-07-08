import { ApiError, api, useQuery } from "@sol/api-client";

import type { SupplierNoteDto } from "../model/note-types";

export const supplierNoteQueryKey = (supplierId: string | undefined) =>
  ["suppliers", supplierId, "note"] as const;

/**
 * GET /catalog/suppliers/{supplierId}/notes
 * 404 when the supplier has no note row yet — treated as null.
 */
export function useSupplierNote(
  supplierId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: supplierNoteQueryKey(supplierId),
    queryFn: async (): Promise<SupplierNoteDto | null> => {
      try {
        return await api.get<SupplierNoteDto>(
          `/catalog/suppliers/${supplierId}/notes`
        );
      } catch (e) {
        if (ApiError.isApiError(e) && e.status === 404) {
          return null;
        }
        throw e;
      }
    },
    enabled: Boolean(supplierId) && options?.enabled !== false,
  });
}
