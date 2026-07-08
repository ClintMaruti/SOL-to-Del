import { api, useQuery } from "@sol/api-client";

import type { Agent } from "../model/types";

/**
 * Hook to fetch a single agent by ID
 * @param id - Agent identifier (GUID or long)
 * @returns Query result with Agent or null
 */
export function useAgent(id: string | null) {
  return useQuery<Agent | null>({
    queryKey: ["agent", id],
    queryFn: async () => {
      if (!id) return null;
      const data = await api.get<Agent>(`/catalog/agents/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
