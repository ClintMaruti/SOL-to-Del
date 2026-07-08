import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  deleteMarginRuleFromInfiniteCaches,
  toLocalIsoDateString,
  type MarginRule,
} from "@/entities/margin-rule";

export interface DeleteMarginRuleVariables {
  marginRuleId: string;
  rule: MarginRule;
}

export function useDeleteMarginRule() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({ marginRuleId }: DeleteMarginRuleVariables) => {
      await api.delete(`/catalog/margin-rules/${marginRuleId}`);
    },
    onSuccess: (_, variables) => {
      deleteMarginRuleFromInfiniteCaches(
        queryClient,
        variables.rule,
        toLocalIsoDateString()
      );

      toast.success(i18n.t("modals.marginRuleDeletedSuccess", { ns: "admin" }));
    },
  });
}
