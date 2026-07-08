import { api, useQuery } from "@sol/api-client";

import { getItinerariesQueryKey } from "../model/queryKeys";
import type {
  ItinerariesListQueryInput,
  ItinerariesListResponse,
} from "../model/types";

import {
  ITINERARIES_SEARCH_PATH,
  buildItinerariesSearchRequestBody,
  normalizeItinerariesListResponse,
} from "./request";

export function useItineraries(params: ItinerariesListQueryInput) {
  return useQuery({
    queryKey: getItinerariesQueryKey(params),
    queryFn: async (): Promise<ItinerariesListResponse> => {
      const body = buildItinerariesSearchRequestBody(params);
      const data = await api.post<unknown>(ITINERARIES_SEARCH_PATH, body);
      return normalizeItinerariesListResponse(data);
    },
    placeholderData: (previousData) => previousData,
  });
}
