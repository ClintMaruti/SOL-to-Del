import { api, useQuery } from "@sol/api-client";

import type { PromotionDetailApiResponse } from "../model/api-types";

export function usePromotion(
  _headOfficeId: string | null,
  promotionId: string | null
) {
  return useQuery({
    queryKey: ["promotion", promotionId],
    queryFn: async () => {
      if (!promotionId) return null;

      return api.get<PromotionDetailApiResponse>(
        `/catalog/promotions/${promotionId}`
      );
    },
    enabled: Boolean(promotionId),
  });
}
