import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

export interface DeleteSupplierServiceParams {
  serviceId: string;
  supplierId: string;
}

export function useDeleteSupplierService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId }: DeleteSupplierServiceParams) => {
      await api.delete(`/catalog/services/${serviceId}`);
      return null;
    },
    onSuccess: (_data, { supplierId }) => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-services", supplierId],
      });
      toast.success(
        i18n.t("modals.supplierServiceDeletedSuccess", { ns: "admin" })
      );
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteSupplierService", { ns: "admin" })
        )
      );
    },
  });
}
