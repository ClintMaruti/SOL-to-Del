import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { UpdateContractedRateRequestBody } from "../model/api-types";
import {
  mapContractedRatesDtoToModel,
  normalizeContractedRatesApiList,
} from "../model/mapContractedRateDtoToModel";
import type { ContractedRate } from "../model/types";
import { contractedRatesQueryKey } from "./contractedRatesQueryKey";

interface UseUpdateContractedRateOptions {
  /** When true, suppresses the per-update success toast (useful for batch edits). */
  silent?: boolean;
  suppressErrorToast?: boolean;
}

export function useUpdateContractedRate(
  serviceId: string,
  contractId: string,
  options?: UseUpdateContractedRateOptions
) {
  const queryClient = useQueryClient();

  return useMutation<
    ContractedRate[],
    Error,
    UpdateContractedRateRequestBody & { id: string }
  >({
    retry: false,
    mutationFn: async ({ id, ...payload }) => {
      const data = await api.put<unknown>(
        `/catalog/services/${serviceId}/contracted-rates/${id}`,
        payload
      );
      const list = normalizeContractedRatesApiList(data);
      return mapContractedRatesDtoToModel(list);
    },
    onSuccess: (updatedRows, { id: parentId }) => {
      const contractedRateId = updatedRows[0]?.contractedRateId ?? parentId;
      queryClient.setQueriesData<ContractedRate[]>(
        { queryKey: ["contracted-rates", serviceId] },
        (prev) => {
          if (!prev) {
            return updatedRows;
          }
          const kept = prev.filter(
            (row) => row.contractedRateId !== contractedRateId
          );
          return [...kept, ...updatedRows];
        }
      );
      queryClient.invalidateQueries({
        queryKey: contractedRatesQueryKey(serviceId, { contractId }),
      });
      if (!options?.silent) {
        toast.success(
          i18n.t("serviceRates.contractedRateUpdatedSuccess", { ns: "admin" })
        );
      }
    },
    onError: (error) => {
      if (options?.suppressErrorToast) {
        return;
      }
      toast.error(
        getErrorMessage(
          error,
          i18n.t("serviceRates.failedToUpdateContractedRate", { ns: "admin" })
        )
      );
    },
  });
}
