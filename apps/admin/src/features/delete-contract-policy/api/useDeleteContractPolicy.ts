import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import { invalidateSupplierContractDetailQueries } from "@/entities/supplier-contract";

export interface DeleteContractPolicyPayload {
  supplierId: string;
  contractId: string;
  policyId: string;
}

export function useDeleteContractPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ policyId }: DeleteContractPolicyPayload) => {
      await api.delete(
        `/catalog/suppliers/contracts/cancellation-policies/${policyId}`
      );
    },
    onSuccess: async (_data, variables) => {
      toast.success(i18n.t("modals.policyDeletedSuccess", { ns: "admin" }));
      await queryClient.invalidateQueries({
        queryKey: ["contract-cancellation-policies", variables.contractId],
      });
      await invalidateSupplierContractDetailQueries(
        queryClient,
        variables.contractId
      );
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(
        error,
        i18n.t("errors.failedToDeletePolicy", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
