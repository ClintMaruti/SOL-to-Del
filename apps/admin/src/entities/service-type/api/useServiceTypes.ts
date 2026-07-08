import { api, useQuery } from "@sol/api-client";

import type { ServiceType } from "../model/types";

export function useServiceTypes() {
  return useQuery<ServiceType[]>({
    queryKey: ["service-types"],
    queryFn: async () => {
      const data = await api.get<ServiceType[]>("/catalog/service-types");
      return Array.isArray(data) ? data : [];
    },
  });
}
