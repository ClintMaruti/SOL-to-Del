import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { CreateRatePlanRequestPayload, RatePlan } from "../model/types";

import { serviceRatePlansUrl } from "./paths";
import { serviceRatePlansQueryKey } from "./useServiceRatePlans";

export function useCreateRatePlan(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRatePlanRequestPayload) =>
      api.post<RatePlan>(serviceRatePlansUrl(serviceId), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: serviceRatePlansQueryKey(serviceId),
      });
      toast.success(i18n.t("modals.ratePlanCreatedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToCreateRatePlan", { ns: "admin" })
        )
      );
    },
  });
}
