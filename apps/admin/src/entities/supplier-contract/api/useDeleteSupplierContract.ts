import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

export interface DeleteSupplierContractPayload {
  supplierId: string;
  contractId: string;
}

export function useDeleteSupplierContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      contractId,
    }: DeleteSupplierContractPayload) => {
      await api.delete(`/catalog/contracts/${contractId}`);
      return { supplierId };
    },
    onSuccess: (_data, variables) => {
      toast.success(i18n.t("modals.contractDeletedSuccess", { ns: "admin" }));
      queryClient.invalidateQueries({
        queryKey: ["supplier-contracts", variables.supplierId],
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(
        error,
        i18n.t("errors.failedToDeleteContract", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
