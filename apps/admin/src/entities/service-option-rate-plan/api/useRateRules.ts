import { api, useQuery } from "@sol/api-client";

import type { ApiRateRule } from "../model/rateRuleMappers";

import { ratePlanRateRulesUrl } from "./paths";

export function rateRulesQueryKey(ratePlanId: string | null) {
  return ["rate-rules", ratePlanId] as const;
}

export function useRateRules(ratePlanId: string | null) {
  return useQuery({
    queryKey: rateRulesQueryKey(ratePlanId),
    queryFn: async (): Promise<ApiRateRule[]> => {
      return api.get<ApiRateRule[]>(ratePlanRateRulesUrl(ratePlanId as string));
    },
    enabled: Boolean(ratePlanId),
  });
}
