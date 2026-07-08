import { api, useMutation, useQueryClient } from "@sol/api-client";

import { useAuthStore } from "@/entities/auth";

import type {
  CreateItineraryPayload,
  ItinerariesListResponse,
  ItineraryListItem,
} from "../model/types";

/**
 * Create response often returns the raw creator id; list search returns a display
 * string. Align cache with what users see after refetch when the id is the
 * signed-in user.
 */
function withBookedByDisplayForCurrentUser(
  itinerary: ItineraryListItem
): ItineraryListItem {
  const user = useAuthStore.getState().user;
  if (!user?.userId || !user.email) {
    return itinerary;
  }
  if (
    itinerary.safariPlanner.trim().toLowerCase() ===
    user.userId.trim().toLowerCase()
  ) {
    return { ...itinerary, safariPlanner: user.email };
  }
  return itinerary;
}

function prependItineraryToList(
  previous: ItinerariesListResponse | undefined,
  itinerary: ItineraryListItem
): ItinerariesListResponse {
  if (!previous) {
    return {
      items: [itinerary],
      total: 1,
    };
  }

  const existingItems = previous.items.filter(
    (item) => item.id !== itinerary.id
  );

  return {
    ...previous,
    items: [itinerary, ...existingItems],
    total:
      existingItems.length === previous.items.length
        ? previous.total + 1
        : previous.total,
  };
}

export function useCreateItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreateItineraryPayload
    ): Promise<ItineraryListItem> => {
      const created = await api.post<ItineraryListItem>(
        "/itinerary/itineraries",
        payload
      );
      return withBookedByDisplayForCurrentUser(created);
    },
    onSuccess: (itinerary) => {
      queryClient.setQueriesData<ItinerariesListResponse>(
        { queryKey: ["itineraries", "list"] },
        (previous) => prependItineraryToList(previous, itinerary)
      );
    },
  });
}
