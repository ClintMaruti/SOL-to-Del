import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

export function useDeleteAgencyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyGroupId: string) => {
      await api.delete(`/catalog/agency-groups/${agencyGroupId}`);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
      toast.success("Agency group deleted successfully");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteAgencyGroup", { ns: "admin" })
        )
      );
    },
  });
}
