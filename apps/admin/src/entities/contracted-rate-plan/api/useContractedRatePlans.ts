import { api, useQuery } from "@sol/api-client";

import type { ContractedRatePlan } from "../model/types";

export function useContractedRatePlans(ratePlanId: string) {
  return useQuery<ContractedRatePlan[]>({
    queryKey: ["contracted-rate-plans", ratePlanId],
    queryFn: async () => {
      const data = await api.get<ContractedRatePlan[]>(
        `/catalog/rate-plans/${ratePlanId}/contracted-rate-plans`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(ratePlanId),
  });
}
