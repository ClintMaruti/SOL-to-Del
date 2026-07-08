import { api, useQuery } from "@sol/api-client";

import {
  normalizeAgency,
  type AgencyApiResponse,
} from "../lib/normalizeAgency";
import type { AgencyDetail } from "../model/types";

export function useAgency(
  agencyId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<AgencyDetail>({
    queryKey: ["agency", agencyId],
    queryFn: async () => {
      const data = await api.get<AgencyApiResponse>(
        `/catalog/agencies/${agencyId}`
      );
      return normalizeAgency(data);
    },
    enabled: Boolean(agencyId) && options?.enabled !== false,
  });
}
