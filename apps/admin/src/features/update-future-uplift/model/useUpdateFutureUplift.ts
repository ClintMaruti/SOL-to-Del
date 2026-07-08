import {
  futureUpliftQueryKeys,
  patchFutureUpliftConfig,
} from "@/entities/future-uplift";
import { useMutation, useQueryClient } from "@sol/api-client";

export function useUpdateFutureUplift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchFutureUpliftConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: futureUpliftQueryKeys.config(),
      });
    },
  });
}
