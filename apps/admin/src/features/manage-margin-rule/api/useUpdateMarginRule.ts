import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  toLocalIsoDateString,
  updateMarginRuleInInfiniteCaches,
  type MarginRule,
} from "@/entities/margin-rule";

import type { UpdateMarginRuleVariables } from "../model/types";

function mergeUpdatedMarginRule(
  response: Partial<MarginRule> | null | undefined,
  variables: UpdateMarginRuleVariables
): MarginRule {
  return {
    ...variables.previousRule,
    ...variables.cacheItem,
    ...response,
    id: response?.id ?? variables.previousRule.id,
    version: response?.version ?? variables.payload.version,
  };
}

export function useUpdateMarginRule() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      marginRuleId,
      payload,
    }: UpdateMarginRuleVariables) => {
      const response = await api.put<Partial<MarginRule> | null>(
        `/catalog/margin-rules/${marginRuleId}`,
        payload
      );

      return response;
    },
    onSuccess: (response, variables) => {
      updateMarginRuleInInfiniteCaches(
        queryClient,
        variables.previousRule,
        mergeUpdatedMarginRule(response, variables),
        toLocalIsoDateString()
      );

      toast.success(i18n.t("modals.marginRuleUpdatedSuccess", { ns: "admin" }));
    },
  });
}
