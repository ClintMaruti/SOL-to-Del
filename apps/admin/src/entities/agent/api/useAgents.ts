import { api, useQuery } from "@sol/api-client";

import type { Agent } from "../model/types";

export function useAgents(agencyId?: string | null) {
  return useQuery<Agent[]>({
    queryKey: agencyId
      ? (["agents", agencyId] as const)
      : (["agents"] as const),
    queryFn: async () => {
      const data = await api.get<Agent[]>(
        `/catalog/agents${agencyId ? `?agencyId=${agencyId}` : ""}`
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
