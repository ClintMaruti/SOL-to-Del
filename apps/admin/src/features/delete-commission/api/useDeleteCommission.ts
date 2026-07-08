import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  getAgencyCommissionsQueryKey,
  type Commission,
} from "@/entities/commission";

export interface DeleteCommissionPayload {
  agencyId: string;
  commissionId: string;
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, commissionId }: DeleteCommissionPayload) => {
      await api.delete(`/catalog/commissions/${commissionId}`);

      return {
        agencyId,
        commissionId,
      };
    },
    onSuccess: ({ agencyId, commissionId }) => {
      queryClient.setQueryData<Commission[]>(
        getAgencyCommissionsQueryKey(agencyId),
        (previous) => {
          const commissions = Array.isArray(previous) ? previous : [];
          return commissions.filter(
            (commission) => commission.id !== commissionId
          );
        }
      );

      toast.success(i18n.t("modals.commissionDeletedSuccess", { ns: "admin" }));
    },
  });
}
