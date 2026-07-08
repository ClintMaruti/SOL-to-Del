import { api, useMutation, useQueryClient } from "@sol/api-client";

export function useDeleteDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (destinationId: string) => {
      // DELETE endpoint performs soft delete by setting DeletedBy and DeletedAt
      // Returns 204 No Content on success
      await api.delete(`/catalog/locations/${destinationId}`);

      return null;
    },
    onSuccess: () => {
      // Invalidate destinations query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
    },
  });
}
