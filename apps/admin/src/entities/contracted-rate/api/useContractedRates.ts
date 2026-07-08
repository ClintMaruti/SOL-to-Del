import { api, useQuery } from "@sol/api-client";

import type { ContractedRatesQueryParams } from "../model/api-types";
import {
  mapContractedRatesDtoToModel,
  normalizeContractedRatesApiList,
} from "../model/mapContractedRateDtoToModel";
import type { ContractedRate } from "../model/types";
import { contractedRatesQueryKey } from "./contractedRatesQueryKey";

function buildQueryString(params: ContractedRatesQueryParams): string {
  const search = new URLSearchParams();
  search.set("contractId", params.contractId);
  if (params.serviceOptionId) {
    search.set("serviceOptionId", params.serviceOptionId);
  }
  if (params.rateId) {
    search.set("rateId", params.rateId);
  }
  if (params.travelDateFrom) {
    search.set("travelDateFrom", params.travelDateFrom);
  }
  if (params.travelDateTo) {
    search.set("travelDateTo", params.travelDateTo);
  }
  return search.toString();
}

export function useContractedRates(
  serviceId: string | null,
  params: ContractedRatesQueryParams | null
) {
  const enabled = Boolean(serviceId && params?.contractId);

  return useQuery<ContractedRate[]>({
    queryKey: contractedRatesQueryKey(serviceId, params),
    queryFn: async () => {
      const qs = buildQueryString(params!);
      const data = await api.get<unknown>(
        `/catalog/services/${serviceId}/contracted-rates?${qs}`
      );
      const list = normalizeContractedRatesApiList(data);
      return mapContractedRatesDtoToModel(list);
    },
    enabled,
  });
}
