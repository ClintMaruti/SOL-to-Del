import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type {
  ServiceRateApiItem,
  ServiceRateCreateRequestBody,
} from "../model/api-types";
import { mapServiceRateApiItemToModel } from "../model/mapServiceRateDtoToModel";
import type { ServiceRate } from "../model/types";
import { serviceRatesQueryKey } from "./serviceRatesQueryKey";

interface UseCreateServiceRateOptions {
  /** When true, caller handles error toasts (e.g. field-level validation in a form). */
  suppressErrorToast?: boolean;
}

export function useCreateServiceRate(
  serviceId: string,
  options?: UseCreateServiceRateOptions
) {
  const queryClient = useQueryClient();

  return useMutation<ServiceRate, Error, ServiceRateCreateRequestBody>({
    retry: false,
    mutationFn: async (payload) => {
      const dto = await api.post<ServiceRateApiItem>(
        `/catalog/services/${serviceId}/rates`,
        payload
      );
      return mapServiceRateApiItemToModel(dto);
    },
    onSuccess: (createdRate) => {
      queryClient.setQueryData<ServiceRate[]>(
        serviceRatesQueryKey(serviceId),
        (prev) => {
          const list = prev ?? [];
          if (list.some((r) => r.id === createdRate.id)) return list;
          return [...list, createdRate];
        }
      );
      toast.success(i18n.t("modals.rateCreatedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      if (options?.suppressErrorToast) {
        return;
      }
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToCreateRate", { ns: "admin" })
        )
      );
    },
  });
}
