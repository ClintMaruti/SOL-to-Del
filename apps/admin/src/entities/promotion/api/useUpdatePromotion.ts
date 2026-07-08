import { api, useMutation, useQueryClient } from "@sol/api-client";

import { updateToggleStatusListCaches } from "@/shared/lib";

import type {
  Promotion,
  UpdatePromotionApiRequestPayload,
  UpdatePromotionApiResponse,
} from "../model";

export function useUpdatePromotion(_headOfficeId: string, promotionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdatePromotionApiRequestPayload
    ): Promise<UpdatePromotionApiResponse> => {
      return api.put<UpdatePromotionApiResponse>(
        `/catalog/promotions/${promotionId}`,
        payload
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["promotion", promotionId], data);

      updateToggleStatusListCaches<Promotion>({
        queryClient,
        rootQueryKey: ["promotions"],
        entityId: promotionId,
        toggle: (promotion) =>
          promotion.id === promotionId
            ? {
                ...promotion,
                name: data.name,
                bookingWindowFrom: data.bookingWindow.from,
                bookingWindowTo: data.bookingWindow.to,
                isActive: data.isActive,
              }
            : promotion,
      });
    },
  });
}
