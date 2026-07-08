import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import { contractedRatesQueryKey } from "./contractedRatesQueryKey";

export function useDeleteContractedRate(serviceId: string, contractId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    retry: false,
    mutationFn: async (id) => {
      await api.delete(`/catalog/services/${serviceId}/contracted-rates/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<unknown[]>(
        { queryKey: ["contracted-rates", serviceId] },
        (prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.filter(
            (row) =>
              (row as { id: string; contractedRateId?: string })
                .contractedRateId !== id && (row as { id: string }).id !== id
          );
        }
      );
      queryClient.invalidateQueries({
        queryKey: contractedRatesQueryKey(serviceId, { contractId }),
      });
      toast.success(
        i18n.t("serviceRates.contractedRateDeletedSuccess", { ns: "admin" })
      );
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("serviceRates.failedToDeleteContractedRate", { ns: "admin" })
        )
      );
    },
  });
}
