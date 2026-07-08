import { api, useMutation, useQueryClient } from "@sol/api-client";

import type {
  Destination,
  DestinationType,
} from "@/entities/destination/model/types";

export interface CreateDestinationPayload {
  parentId: string | null;
  name: string;
  type: DestinationType;
  code?: string;
  latitude?: number;
  longitude?: number;
  isPreferred?: boolean;
}

export function useCreateDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDestinationPayload) => {
      const data = await api.post<Destination>("/catalog/locations", payload);

      return data;
    },
    onSuccess: () => {
      // Invalidate destinations query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
    },
  });
}
