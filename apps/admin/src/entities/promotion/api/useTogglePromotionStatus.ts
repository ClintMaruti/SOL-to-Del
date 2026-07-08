import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { updateToggleStatusListCaches } from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { PromotionApiResponse } from "../model/api-types";
import type { Promotion } from "../model/types";

export interface TogglePromotionStatusParams {
  headOfficeId: string;
  promotionId: string;
  activate: boolean;
}

export function useTogglePromotionStatus() {
  const queryClient = useQueryClient();
  const { setPromotionsStatus } = useLoadingStates(
    useShallow((state) => ({
      setPromotionsStatus: state.setPromotionsStatus,
    }))
  );

  return useMutation({
    mutationFn: async ({
      headOfficeId: _headOfficeId,
      promotionId,
      activate,
    }: TogglePromotionStatusParams) => {
      setPromotionsStatus(promotionId, true);

      const path = activate
        ? `/catalog/promotions/${promotionId}/activate`
        : `/catalog/promotions/${promotionId}/deactivate`;

      return api.patch<PromotionApiResponse>(path);
    },
    onSuccess: (_, { promotionId }) => {
      setPromotionsStatus(promotionId, false);

      const toggle = (promotion: Promotion) =>
        promotion.id === promotionId
          ? { ...promotion, isActive: !promotion.isActive }
          : promotion;

      updateToggleStatusListCaches({
        queryClient,
        rootQueryKey: ["promotions"],
        entityId: promotionId,
        toggle,
      });
    },
    onError: (error, { promotionId }) => {
      setPromotionsStatus(promotionId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdatePromotionStatus", { ns: "admin" })
        )
      );
    },
  });
}
