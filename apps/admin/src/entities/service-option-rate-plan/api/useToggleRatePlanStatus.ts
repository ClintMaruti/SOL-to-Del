import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { RatePlan } from "../model/types";

import {
  catalogServiceRatePlanActivateUrl,
  catalogServiceRatePlanDeactivateUrl,
} from "./paths";
import { serviceRatePlansQueryKey } from "./useServiceRatePlans";

export interface ToggleRatePlanStatusParams {
  serviceId: string;
  ratePlanId: string;
  active: boolean;
}

export function useToggleRatePlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ratePlanId, active }: ToggleRatePlanStatusParams) => {
      const path = active
        ? catalogServiceRatePlanActivateUrl(ratePlanId)
        : catalogServiceRatePlanDeactivateUrl(ratePlanId);
      return api.patch<RatePlan>(path);
    },
    onSuccess: (_data, { serviceId, active }) => {
      if (active) {
        toast.success(
          i18n.t("modals.ratePlanActivatedSuccess", { ns: "admin" })
        );
      } else {
        toast.success(
          i18n.t("modals.ratePlanDeactivatedSuccess", { ns: "admin" })
        );
      }

      queryClient.invalidateQueries({
        queryKey: serviceRatePlansQueryKey(serviceId),
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToToggleRatePlanStatus", { ns: "admin" })
        )
      );
    },
  });
}
