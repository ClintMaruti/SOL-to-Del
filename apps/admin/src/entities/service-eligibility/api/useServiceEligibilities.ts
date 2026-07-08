import { api, useQuery } from "@sol/api-client";

import type { ServiceEligibility } from "../model/types";

import { serviceEligibilitiesQueryKey } from "./eligibility-cache";
import { normalizeServiceEligibilityList } from "./normalize-service-eligibility";

export function useServiceEligibilities(serviceId: string | null) {
  return useQuery<ServiceEligibility[]>({
    queryKey: serviceEligibilitiesQueryKey(serviceId),
    queryFn: async () => {
      const response = await api.get<unknown>(
        `/catalog/services/${serviceId}/eligibilities`
      );
      return normalizeServiceEligibilityList(response);
    },
    enabled: Boolean(serviceId),
  });
}
