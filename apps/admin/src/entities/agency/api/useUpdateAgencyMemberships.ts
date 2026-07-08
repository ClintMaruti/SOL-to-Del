import { useMutation, useQueryClient } from "@sol/api-client";

import { buildUpdatePayloadFromAgency } from "../lib/buildUpdatePayloadFromAgency";
import type { Agency, AgencyDetail } from "../model/types";

import { updateAgencyRequest } from "./useUpdateAgency";

export interface AgencyMembershipUpdate {
  agency: Agency;
  agencyGroupIds: string[];
}

export interface UpdateAgencyMembershipsParams {
  updates: AgencyMembershipUpdate[];
  affectedAgencyGroupIds: string[];
}

export function useUpdateAgencyMemberships() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updates,
    }: UpdateAgencyMembershipsParams): Promise<AgencyDetail[]> => {
      return Promise.all(
        updates.map(({ agency, agencyGroupIds }) =>
          updateAgencyRequest(
            agency.id,
            buildUpdatePayloadFromAgency(agency, { agencyGroupIds })
          )
        )
      );
    },
    onSuccess: (updatedAgencies, variables) => {
      for (const agency of updatedAgencies) {
        if (!agency?.id) continue;
        queryClient.setQueryData<AgencyDetail>(["agency", agency.id], agency);
        queryClient.invalidateQueries({ queryKey: ["agency", agency.id] });
      }

      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });

      for (const groupId of variables.affectedAgencyGroupIds) {
        queryClient.invalidateQueries({ queryKey: ["agency-group", groupId] });
      }
    },
  });
}
