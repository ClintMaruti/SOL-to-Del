import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import { supplierCloseoutsQueryKey } from "@/entities/supplier-closeout";

export interface DeleteSupplierCloseoutPayload {
  supplierId: string;
  closeoutId: string;
}

export function useDeleteSupplierCloseout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      closeoutId,
    }: DeleteSupplierCloseoutPayload) => {
      await api.delete(`/catalog/closeouts/${closeoutId}`);
      return { supplierId };
    },
    onSuccess: (_data, variables) => {
      toast.success(i18n.t("modals.closeoutDeletedSuccess", { ns: "admin" }));
      queryClient.invalidateQueries({
        queryKey: supplierCloseoutsQueryKey(variables.supplierId),
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteCloseout", { ns: "admin" })
        )
      );
    },
  });
}
