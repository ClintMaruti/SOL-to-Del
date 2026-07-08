import { api, useQuery } from "@sol/api-client";

import type { RatePlan } from "../model/types";

export function useRatePlans(contractId: string) {
  return useQuery<RatePlan[]>({
    queryKey: ["rate-plans", contractId],
    queryFn: async () => {
      const data = await api.get<RatePlan[]>(
        `/catalog/contracts/${contractId}/rate-plans`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(contractId),
  });
}
