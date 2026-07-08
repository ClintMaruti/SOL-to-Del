import { api, useQuery } from "@sol/api-client";

import type { SafariPlanner } from "../types";

export function useSafariPlanners() {
  return useQuery<SafariPlanner[]>({
    queryKey: ["safari-planners"],
    queryFn: async () => {
      const data = await api.get<SafariPlanner[]>("/catalog/safari-planners");
      return Array.isArray(data) ? data : [];
    },
  });
}
