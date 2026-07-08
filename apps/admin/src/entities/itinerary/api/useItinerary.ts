import { api, useQuery } from "@sol/api-client";

import type { ItineraryDetail } from "../model/types";

export function useItinerary(id: string | undefined) {
  return useQuery({
    queryKey: ["itineraries", "detail", id],
    queryFn: () => api.get<ItineraryDetail>(`/itinerary/itineraries/${id}`),
    enabled: !!id,
  });
}
