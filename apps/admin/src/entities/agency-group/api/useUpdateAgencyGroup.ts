import { api, useMutation, useQueryClient } from "@sol/api-client";

import type { AgencyGroup } from "../model/types";

/** Request body for PUT /api/catalog/agency-groups. Backend does not accept agencies; membership is stored on each agency via agencyGroupIds. */
export interface UpdateAgencyGroupPayload {
  name: string;
  description: string | null;
  isActive: boolean;
  version: number;
}

export function useUpdateAgencyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyGroupId,
      payload,
    }: {
      agencyGroupId: string;
      payload: UpdateAgencyGroupPayload;
    }): Promise<AgencyGroup> => {
      const data = await api.put<AgencyGroup>(
        `/catalog/agency-groups/${agencyGroupId}`,
        payload
      );
      return data;
    },
    onSuccess: (data, variables) => {
      const id = data?.id ?? variables.agencyGroupId;
      if (id && data) {
        queryClient.setQueryData<AgencyGroup>(["agency-group", id], (prev) =>
          prev ? { ...prev, ...data } : data
        );
      }
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["agency-group", id],
        });
      }
    },
  });
}
