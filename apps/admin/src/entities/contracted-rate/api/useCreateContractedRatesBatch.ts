import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { CreateContractedRatesRequestBody } from "../model/api-types";
import {
  mapContractedRatesDtoToModel,
  mapCreateContractedRatesBodyToApi,
  normalizeContractedRatesApiList,
} from "../model/mapContractedRateDtoToModel";
import type { ContractedRate } from "../model/types";
import { contractedRatesQueryKey } from "./contractedRatesQueryKey";

interface UseCreateContractedRatesBatchOptions {
  /** When true, suppresses the per-create success toast (useful in edit mode when a single toast is shown after all ops). */
  silent?: boolean;
  /** When true, caller handles error toasts (e.g. field-level validation in a form). */
  suppressErrorToast?: boolean;
}

export function useCreateContractedRatesBatch(
  serviceId: string,
  contractId: string,
  options?: UseCreateContractedRatesBatchOptions
) {
  const queryClient = useQueryClient();

  return useMutation<ContractedRate[], Error, CreateContractedRatesRequestBody>(
    {
      retry: false,
      mutationFn: async (payload) => {
        const data = await api.post<unknown>(
          `/catalog/services/${serviceId}/contracted-rates`,
          mapCreateContractedRatesBodyToApi(payload)
        );
        const list = normalizeContractedRatesApiList(data);
        return mapContractedRatesDtoToModel(list);
      },
      onSuccess: (created) => {
        queryClient.invalidateQueries({
          queryKey: contractedRatesQueryKey(serviceId, { contractId }),
        });
        if (!options?.silent) {
          const count = created.length;
          toast.success(
            i18n.t("serviceRates.contractedRatesCreatedSuccess", {
              ns: "admin",
              count,
            })
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
            i18n.t("serviceRates.failedToCreateContractedRates", {
              ns: "admin",
            })
          )
        );
      },
    }
  );
}
