import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import { catalogRateRuleUrl } from "./paths";
import { rateRulesQueryKey } from "./useRateRules";

export function useDeleteRateRule(ratePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rateRuleId: string) =>
      api.delete(catalogRateRuleUrl(rateRuleId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: rateRulesQueryKey(ratePlanId),
      });
      toast.success(i18n.t("modals.rateRuleDeletedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteRateRule", { ns: "admin" })
        )
      );
    },
  });
}
