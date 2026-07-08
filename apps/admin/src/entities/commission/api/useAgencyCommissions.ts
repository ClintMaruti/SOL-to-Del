import { api, useQuery } from "@sol/api-client";

import { getAgencyCommissionsQueryKey } from "../model/queryKeys";
import { sortCommissionsByEffectiveFromDesc } from "../model/list";
import type { Commission } from "../model/types";

export function useAgencyCommissions(agencyId?: string | null) {
  return useQuery<Commission[]>({
    queryKey: getAgencyCommissionsQueryKey(agencyId),
    queryFn: async () => {
      const data = await api.get<Commission[] | null>(
        `/catalog/agencies/${agencyId}/commissions`
      );

      return Array.isArray(data)
        ? sortCommissionsByEffectiveFromDesc(data)
        : [];
    },
    enabled: Boolean(agencyId),
  });
}
