import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type {
  ServiceOptionRateApiItem,
  ServiceOptionRateMutationRequestBody,
} from "../model/api-types";
import { mapServiceOptionRateApiItemToRate } from "../model/mapServiceOptionRatesDtoToModel";
import type { ServiceOptionRate } from "../model/types";

export type { ServiceOptionRateMutationRequestBody } from "../model/api-types";
export type CreateRatePayload = ServiceOptionRateMutationRequestBody;

export function useCreateServiceOptionRate(serviceOptionId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceOptionRate,
    Error,
    ServiceOptionRateMutationRequestBody
  >({
    retry: false,
    mutationFn: async (payload: CreateRatePayload) => {
      const dto = await api.post<ServiceOptionRateApiItem>(
        `/catalog/services/options/${serviceOptionId}/rates`,
        payload
      );
      return mapServiceOptionRateApiItemToRate(dto);
    },
    onSuccess: (createdRate) => {
      queryClient.setQueryData<ServiceOptionRate[]>(
        ["service-option-rates", serviceOptionId],
        (prev) => {
          const list = prev ?? [];
          if (list.some((r) => r.id === createdRate.id)) {
            return list;
          }
          return [...list, createdRate];
        }
      );
      queryClient.invalidateQueries({
        queryKey: ["service-option-rates", serviceOptionId],
      });
      toast.success(i18n.t("modals.rateCreatedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToCreateRate", { ns: "admin" })
        )
      );
    },
  });
}
