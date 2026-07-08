import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  getAgencyCommissionsQueryKey,
  sortCommissionsByEffectiveFromDesc,
  type Commission,
} from "@/entities/commission";

export interface UpdateCommissionPayload {
  commissionId: string;
  payload: {
    effectiveFrom: string;
    commissionPercent: number;
    version: number;
  };
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commissionId, payload }: UpdateCommissionPayload) => {
      const data = await api.put<Commission>(
        `/catalog/commissions/${commissionId}`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Commission[]>(
        getAgencyCommissionsQueryKey(data.agencyId),
        (previous) => {
          const commissions = Array.isArray(previous) ? previous : [];
          const commissionIndex = commissions.findIndex(
            (commission) => commission.id === data.id
          );

          if (commissionIndex === -1) {
            return sortCommissionsByEffectiveFromDesc([...commissions, data]);
          }

          return sortCommissionsByEffectiveFromDesc(
            commissions.map((commission) =>
              commission.id === data.id ? data : commission
            )
          );
        }
      );

      toast.success(i18n.t("modals.commissionUpdatedSuccess", { ns: "admin" }));
    },
  });
}
