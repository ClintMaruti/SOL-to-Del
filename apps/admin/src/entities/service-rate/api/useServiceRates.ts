import { api, useQuery } from "@sol/api-client";

import type { ServiceRateApiItem } from "../model/api-types";
import { mapServiceRatesDtoToModel } from "../model/mapServiceRateDtoToModel";
import type { ServiceRate } from "../model/types";
import { serviceRatesQueryKey } from "./serviceRatesQueryKey";

export function useServiceRates(serviceId: string | null) {
  return useQuery<ServiceRate[]>({
    queryKey: serviceRatesQueryKey(serviceId ?? ""),
    queryFn: async () => {
      const data = await api.get<ServiceRateApiItem[] | unknown>(
        `/catalog/services/${serviceId}/rates`
      );
      const list = Array.isArray(data) ? data : [];
      return mapServiceRatesDtoToModel(list);
    },
    enabled: Boolean(serviceId),
  });
}
