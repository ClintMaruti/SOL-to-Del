import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { SupplierContractApiResponse } from "../model/api-types";
import type { SupplierContract } from "../model/types";

interface ToggleSupplierContractStatusParams {
  supplierId: string;
  contractId: string;
  isActive: boolean;
}

export function useToggleSupplierContractStatus() {
  const queryClient = useQueryClient();
  const { setSupplierContractsStatus } = useLoadingStates(
    useShallow((state) => ({
      setSupplierContractsStatus: state.setSupplierContractsStatus,
    }))
  );

  return useMutation({
    mutationFn: async ({
      contractId,
      isActive,
    }: ToggleSupplierContractStatusParams) => {
      setSupplierContractsStatus(contractId, true);
      const url = isActive
        ? `/catalog/contracts/${contractId}/deactivate`
        : `/catalog/contracts/${contractId}/activate`;
      const response = await api.patch<SupplierContractApiResponse>(url);
      return response;
    },
    onSuccess: (_data, { supplierId, contractId, isActive }) => {
      setSupplierContractsStatus(contractId, false);
      if (!isActive) {
        toast.success(i18n.t("admin:modals.contractActivatedSuccess"));
      }
      queryClient.setQueryData<SupplierContract[]>(
        ["supplier-contracts", supplierId],
        (previous) => {
          if (!previous) return previous;
          return previous.map((contract) =>
            contract.id === contractId
              ? { ...contract, isActive: !contract.isActive }
              : contract
          );
        }
      );
      queryClient.setQueryData<SupplierContract>(
        ["supplier-contracts", supplierId, contractId],
        (previous) =>
          previous ? { ...previous, isActive: !previous.isActive } : previous
      );
    },
    onError: (error, { contractId }) => {
      setSupplierContractsStatus(contractId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateContractStatus", { ns: "admin" })
        )
      );
    },
  });
}
