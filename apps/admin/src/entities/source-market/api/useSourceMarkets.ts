import { api, useQuery } from "@sol/api-client";

import type { SourceMarket } from "../model/types";

export function useSourceMarkets() {
  return useQuery<SourceMarket[]>({
    queryKey: ["source-markets"],
    queryFn: async () => {
      const data = await api.get<SourceMarket[]>("/catalog/source-markets");
      return Array.isArray(data) ? data : [];
    },
  });
}
