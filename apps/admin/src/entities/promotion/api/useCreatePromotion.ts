import { api, useMutation, useQueryClient } from "@sol/api-client";

import type {
  CreatePromotionApiRequestPayload,
  CreatePromotionApiResponse,
} from "../model/api-types";
import type { Promotion } from "../model/types";

function toPromotionSummary(promotion: CreatePromotionApiResponse): Promotion {
  return {
    id: promotion.id,
    name: promotion.name,
    headOfficeId: promotion.headOfficeId,
    bookingWindowFrom: promotion.bookingWindow.from,
    bookingWindowTo: promotion.bookingWindow.to,
    isActive: promotion.isActive,
  };
}

function upsertPromotionSummary(
  promotions: Promotion[],
  summary: Promotion
): Promotion[] {
  const existingIndex = promotions.findIndex(
    (promotion) => promotion.id === summary.id
  );

  if (existingIndex === -1) {
    return [summary, ...promotions];
  }

  return promotions.map((promotion, index) =>
    index === existingIndex ? summary : promotion
  );
}

export function useCreatePromotion(headOfficeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreatePromotionApiRequestPayload
    ): Promise<CreatePromotionApiResponse> => {
      return api.post<CreatePromotionApiResponse>(
        `/catalog/head-offices/${headOfficeId}/promotions`,
        payload
      );
    },
    onSuccess: (data) => {
      const summary = toPromotionSummary(data);

      queryClient.setQueryData(["promotion", data.id], data);
      queryClient.setQueryData<Promotion[]>(["promotions"], (previous) => {
        if (!Array.isArray(previous)) {
          return previous;
        }

        return upsertPromotionSummary(previous, summary);
      });
      queryClient
        .getQueryCache()
        .findAll({ queryKey: ["promotions"] })
        .forEach(({ queryKey }) => {
          if (queryKey.length === 1 || queryKey[1] !== headOfficeId) {
            return;
          }

          queryClient.setQueryData<Promotion[]>(queryKey, (previous) => {
            if (!Array.isArray(previous)) {
              return previous;
            }

            return upsertPromotionSummary(previous, summary);
          });
        });
    },
  });
}
