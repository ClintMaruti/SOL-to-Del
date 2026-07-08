import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

export function useDeleteSupplierHeadOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierHeadOfficeId: string) => {
      await api.delete(`/catalog/head-offices/${supplierHeadOfficeId}`);
      return null;
    },
    onSuccess: () => {
      // Invalidate supplier head offices query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["supplier-head-offices"] });
      toast.success("Supplier head office deleted successfully");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteSupplierHeadOffice", { ns: "admin" })
        )
      );
    },
  });
}
