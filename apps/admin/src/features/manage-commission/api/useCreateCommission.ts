import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  getAgencyCommissionsQueryKey,
  sortCommissionsByEffectiveFromDesc,
  type Commission,
} from "@/entities/commission";

export interface CreateCommissionPayload {
  agencyId: string;
  payload: {
    effectiveFrom: string;
    commissionPercent: number;
  };
}

export function useCreateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, payload }: CreateCommissionPayload) => {
      const data = await api.post<Commission>(
        `/catalog/agencies/${agencyId}/commissions`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Commission[]>(
        getAgencyCommissionsQueryKey(data.agencyId),
        (previous) => {
          const commissions = Array.isArray(previous) ? previous : [];
          return sortCommissionsByEffectiveFromDesc([...commissions, data]);
        }
      );

      toast.success(i18n.t("modals.commissionCreatedSuccess", { ns: "admin" }));
    },
  });
}
