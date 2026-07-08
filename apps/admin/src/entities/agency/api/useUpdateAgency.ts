import { api, useMutation, useQueryClient } from "@sol/api-client";

import {
  normalizeAgency,
  type AgencyApiResponse,
} from "../lib/normalizeAgency";
import type { AgencyDetail, AgencyWritePayload } from "../model/types";

/** Request body for PUT /api/catalog/agencies/:id */
export interface UpdateAgencyPayload extends AgencyWritePayload {
  version: number;
  isActive: boolean;
}

export async function updateAgencyRequest(
  agencyId: string,
  payload: UpdateAgencyPayload
) {
  const data = await api.put<AgencyApiResponse>(`/catalog/agencies`, {
    ...payload,
    id: agencyId,
  });
  return normalizeAgency(data);
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      payload,
    }: {
      agencyId: string;
      payload: UpdateAgencyPayload;
    }) => {
      return updateAgencyRequest(agencyId, payload);
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData<AgencyDetail>(
          ["agency", data.id],
          (previous) => {
            if (previous != null && data.version < previous.version) {
              return previous;
            }
            return data;
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["agency", data.id] });
        for (const groupId of data.agencyGroupIds ?? []) {
          queryClient.invalidateQueries({
            queryKey: ["agency-group", groupId],
          });
        }
      }
    },
  });
}
