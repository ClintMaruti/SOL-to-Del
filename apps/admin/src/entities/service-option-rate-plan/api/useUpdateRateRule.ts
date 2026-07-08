import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { ApiRateRule } from "../model/rateRuleMappers";
import type { UpdateRateRulePayload } from "../model/types";

import { catalogRateRuleUrl } from "./paths";
import { rateRulesQueryKey } from "./useRateRules";

export function useUpdateRateRule(ratePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rateRuleId,
      payload,
    }: {
      rateRuleId: string;
      payload: UpdateRateRulePayload;
    }) => api.put<ApiRateRule>(catalogRateRuleUrl(rateRuleId), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: rateRulesQueryKey(ratePlanId),
      });
      toast.success(i18n.t("modals.rateRuleUpdatedSuccess", { ns: "admin" }));
    },
  });
}
