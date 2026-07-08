import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { ContractedRatePlan } from "../model/types";

export interface UpdateContractedRatePlanPayload {
  id: string;
  ratePlanId: string;
  name?: string;
  validityDateFrom?: string;
  validityDateTo?: string;
  payAtProperty?: boolean;
  isActive?: boolean;
}

export function useUpdateContractedRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ratePlanId: _ratePlanId,
      ...body
    }: UpdateContractedRatePlanPayload) => {
      const data = await api.patch<ContractedRatePlan>(
        `/catalog/contracted-rate-plans/${id}`,
        body
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        i18n.t("modals.contractedRatePlanUpdatedSuccess", { ns: "admin" })
      );
      queryClient.invalidateQueries({
        queryKey: ["contracted-rate-plans", variables.ratePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["contracted-rate-plan", variables.id],
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateContractedRatePlan", { ns: "admin" })
        )
      );
    },
  });
}
