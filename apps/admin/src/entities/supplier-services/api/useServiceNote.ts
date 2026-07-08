import { ApiError, api, useQuery } from "@sol/api-client";

import type { CatalogEntityNote } from "../types";

export function useServiceNote(serviceId: string | null) {
  return useQuery<CatalogEntityNote | null>({
    queryKey: ["supplier-service-note", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      try {
        return await api.get<CatalogEntityNote>(
          `/catalog/services/${serviceId}/notes`
        );
      } catch (err) {
        if (ApiError.isApiError(err) && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(serviceId),
  });
}
