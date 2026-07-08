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
  ServiceRateUpdateRequestBody,
} from "../model/api-types";
import { mapServiceRateApiItemToModel } from "../model/mapServiceRateDtoToModel";
import type { ServiceRate } from "../model/types";
import { serviceRatesQueryKey } from "./serviceRatesQueryKey";

interface UseUpdateServiceRateOptions {
  suppressErrorToast?: boolean;
}

export function useUpdateServiceRate(
  serviceId: string,
  options?: UseUpdateServiceRateOptions
) {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceRate,
    Error,
    ServiceRateUpdateRequestBody & { id: string }
  >({
    retry: false,
    mutationFn: async ({ id, ...payload }) => {
      const dto = await api.put<ServiceRateApiItem>(
        `/catalog/services/${serviceId}/rates/${id}`,
        payload
      );
      return mapServiceRateApiItemToModel(dto);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ServiceRate[]>(
        serviceRatesQueryKey(serviceId),
        (prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r))
      );
      toast.success(i18n.t("modals.rateUpdatedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      if (options?.suppressErrorToast) {
        return;
      }
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateRate", { ns: "admin" })
        )
      );
    },
  });
}
