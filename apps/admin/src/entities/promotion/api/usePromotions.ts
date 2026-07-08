import { api, useQuery } from "@sol/api-client";

import type { PromotionsListResponse } from "../model/api-types";
import type { Promotion } from "../model/types";

export function usePromotions(headOfficeId: string | null) {
  return useQuery<Promotion[]>({
    queryKey: ["promotions", headOfficeId],
    queryFn: async () => {
      if (!headOfficeId) return [];

      const data = await api.get<PromotionsListResponse>(
        `/catalog/head-offices/${headOfficeId}/promotions`
      );

      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(headOfficeId),
  });
}
