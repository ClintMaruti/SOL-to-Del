import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { RatePlan, UpdateRatePlanPayload } from "../model/types";

import { catalogServiceRatePlanByIdUrl } from "./paths";
import { serviceRatePlansQueryKey } from "./useServiceRatePlans";

export function useUpdateRatePlan(serviceId: string, ratePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRatePlanPayload) =>
      api.put<RatePlan>(catalogServiceRatePlanByIdUrl(ratePlanId), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: serviceRatePlansQueryKey(serviceId),
      });
      toast.success(i18n.t("modals.ratePlanUpdatedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateRatePlan", { ns: "admin" })
        )
      );
    },
  });
}
