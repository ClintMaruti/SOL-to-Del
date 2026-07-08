import { api, useMutation, useQueryClient } from "@sol/api-client";

import type { AgencyGroup } from "@/entities/agency-group/model/types";

/** Request body for POST /api/catalog/agency-groups. Backend does not accept agencies. */
export interface CreateAgencyGroupPayload {
  name: string;
  description: string;
  isActive?: boolean;
}

export function useCreateAgencyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreateAgencyGroupPayload
    ): Promise<AgencyGroup> => {
      const data = await api.post<AgencyGroup>(
        "/catalog/agency-groups",
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["agency-group", data.id],
        });
      }
    },
  });
}
