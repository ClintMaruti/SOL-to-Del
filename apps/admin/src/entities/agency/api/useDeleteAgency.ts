import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

export function useDeleteAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      await api.delete(`/catalog/agencies/${agencyId}`);
      return null;
    },
    onSuccess: () => {
      // Invalidate agencies query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
      toast.success("Agency deleted successfully");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteAgency", { ns: "admin" })
        )
      );
    },
  });
}
