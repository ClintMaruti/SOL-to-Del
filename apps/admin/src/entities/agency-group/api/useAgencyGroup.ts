import { api } from "@sol/api-client";
import { useQuery } from "@tanstack/react-query";

import type { AgencyGroup } from "../model/types";

export function useAgencyGroup(agencyGroupId: string | null | undefined) {
  return useQuery({
    queryKey: ["agency-group", agencyGroupId],
    queryFn: async () => {
      const data = await api.get<AgencyGroup>(
        `/catalog/agency-groups/${agencyGroupId}`
      );
      return data;
    },
    enabled: !!agencyGroupId,
  });
}
