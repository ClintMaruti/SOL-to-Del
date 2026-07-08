import { api, useQuery } from "@sol/api-client";

import type { ContractedRatePlan } from "../model/types";

export function useContractedRatePlan(id: string | null) {
  return useQuery<ContractedRatePlan>({
    queryKey: ["contracted-rate-plan", id],
    queryFn: async () => {
      const data = await api.get<ContractedRatePlan>(
        `/catalog/contracted-rate-plans/${id}`
      );
      return data;
    },
    enabled: Boolean(id),
  });
}
