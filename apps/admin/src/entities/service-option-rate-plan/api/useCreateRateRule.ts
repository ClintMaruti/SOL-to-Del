import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { ApiRateRule } from "../model/rateRuleMappers";
import type { CreateRateRulePayload } from "../model/types";

import { ratePlanRateRulesUrl } from "./paths";
import { rateRulesQueryKey } from "./useRateRules";

export function useCreateRateRule(ratePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRateRulePayload) =>
      api.post<ApiRateRule>(ratePlanRateRulesUrl(ratePlanId), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: rateRulesQueryKey(ratePlanId),
      });
      toast.success(i18n.t("modals.rateRuleCreatedSuccess", { ns: "admin" }));
    },
  });
}
