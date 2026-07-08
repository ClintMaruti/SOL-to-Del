import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { ServiceRate } from "../model/types";
import { serviceRatesQueryKey } from "./serviceRatesQueryKey";

export function useDeleteServiceRate(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    retry: false,
    mutationFn: async (rateId) => {
      await api.delete(`/catalog/services/${serviceId}/rates/${rateId}`);
    },
    onSuccess: (_data, rateId) => {
      queryClient.setQueryData<ServiceRate[]>(
        serviceRatesQueryKey(serviceId),
        (prev) => (prev ?? []).filter((r) => r.id !== rateId)
      );
      toast.success(i18n.t("serviceRates.rateDeletedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("serviceRates.failedToDeleteRate", { ns: "admin" })
        )
      );
    },
  });
}
