import { api, useQuery } from "@sol/api-client";

import type { ServiceOption } from "../model/types";

export function useServiceOptions(serviceId: string | null) {
  return useQuery<ServiceOption[]>({
    queryKey: ["service-options", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const data = await api.get<ServiceOption[]>(
        `/catalog/services/${serviceId}/options`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(serviceId),
  });
}
