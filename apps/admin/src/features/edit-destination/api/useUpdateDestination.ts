import { api, useMutation, useQueryClient } from "@sol/api-client";

import type {
  DestinationApiItem,
  UpdateLocationRequest,
} from "@/entities/destination/model/api-types";

export function useUpdateDestination() {
  const queryClient = useQueryClient();

  return useMutation<DestinationApiItem, Error, UpdateLocationRequest>({
    mutationFn: (data: UpdateLocationRequest) =>
      api.put<DestinationApiItem>("/catalog/locations", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      queryClient.invalidateQueries({
        queryKey: ["destination", variables.id],
      });
    },
  });
}
