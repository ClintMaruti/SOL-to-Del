import { api, useQuery } from "@sol/api-client";

import type { AgencyGroup } from "../model/types";

interface UseAgencyGroupsOptions {
  enabled?: boolean;
}

export function useAgencyGroups(options: UseAgencyGroupsOptions = {}) {
  return useQuery<AgencyGroup[]>({
    queryKey: ["agency-groups"],
    queryFn: async () => {
      const data = await api.get<AgencyGroup[]>("/catalog/agency-groups");
      return Array.isArray(data) ? data : [];
    },
    enabled: options.enabled ?? true,
  });
}
