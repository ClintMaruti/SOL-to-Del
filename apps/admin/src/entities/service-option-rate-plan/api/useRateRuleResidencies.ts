import { api, useQuery } from "@sol/api-client";

import type { RateRuleResidencyOption } from "../model/types";

import { catalogRateRuleResidenciesUrl } from "./paths";

export function rateRuleResidenciesQueryKey() {
  return ["rate-rule-residencies"] as const;
}

export function useRateRuleResidencies() {
  return useQuery({
    queryKey: rateRuleResidenciesQueryKey(),
    queryFn: async (): Promise<RateRuleResidencyOption[]> => {
      const data = await api.get<RateRuleResidencyOption[]>(
        catalogRateRuleResidenciesUrl()
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
