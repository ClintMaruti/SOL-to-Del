import { api, useQuery } from "@sol/api-client";

import type { ServiceOptionRateApiItem } from "../model/api-types";
import { mapServiceOptionRatesDtoToModel } from "../model/mapServiceOptionRatesDtoToModel";
import type { ServiceOptionRate } from "../model/types";

/** Draft option ids use this prefix until POST creates a persisted option (same as `LOCAL_ID_PREFIX` in service-options-tab). */
const DRAFT_SERVICE_OPTION_ID_PREFIX = "temp-";

/** True when the option exists only in local UI and has not been persisted yet. */
export function isDraftServiceOptionId(id: string | null | undefined): boolean {
  return Boolean(id?.startsWith(DRAFT_SERVICE_OPTION_ID_PREFIX));
}

function shouldFetchRates(serviceOptionId: string | null): boolean {
  return Boolean(serviceOptionId) && !isDraftServiceOptionId(serviceOptionId);
}

export function useServiceOptionRates(serviceOptionId: string | null) {
  return useQuery<ServiceOptionRate[]>({
    queryKey: ["service-option-rates", serviceOptionId],
    queryFn: async () => {
      const data = await api.get<ServiceOptionRateApiItem[] | unknown>(
        `/catalog/services/options/${serviceOptionId}/rates`
      );
      const list = Array.isArray(data) ? data : [];

      return mapServiceOptionRatesDtoToModel(list);
    },
    enabled: shouldFetchRates(serviceOptionId),
  });
}
