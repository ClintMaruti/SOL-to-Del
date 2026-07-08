import { api, useQuery } from "@sol/api-client";

import type { RatePlan } from "../model/types";

import { serviceRatePlansUrl } from "./paths";

export function serviceRatePlansQueryKey(serviceId: string | null) {
  return ["service-rate-plans", serviceId] as const;
}

export function useServiceRatePlans(serviceId: string | null) {
  return useQuery<RatePlan[]>({
    queryKey: serviceRatePlansQueryKey(serviceId),
    queryFn: async () => {
      const data = await api.get<RatePlan[]>(
        serviceRatePlansUrl(serviceId as string)
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(serviceId),
  });
}
