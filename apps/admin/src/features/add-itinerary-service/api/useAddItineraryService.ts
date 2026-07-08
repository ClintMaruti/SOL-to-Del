import { api, useMutation, useQueryClient } from "@sol/api-client";

import type { AddServicePayload, ItineraryServiceItem } from "../model/types";

export function useAddItineraryService(itineraryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddServicePayload) =>
      api.post<ItineraryServiceItem>(
        `/itinerary/itineraries/${itineraryId}/services`,
        payload
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", itineraryId],
      });
    },
  });
}
