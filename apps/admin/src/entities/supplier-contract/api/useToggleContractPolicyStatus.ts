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

import { invalidateSupplierContractDetailQueries } from "./invalidateSupplierContractDetailQueries";
import {
  normalizeContractPolicy,
  type ContractPolicy,
  type ContractPolicyDto,
} from "../model/types";

interface ToggleContractPolicyStatusParams {
  supplierId: string;
  contractId: string;
  policyId: string;
  isActive: boolean;
}

export function useToggleContractPolicyStatus() {
  const queryClient = useQueryClient();
  const { setPoliciesStatus } = useLoadingStates(
    useShallow((state) => ({
      setPoliciesStatus: state.setPoliciesStatus,
    }))
  );

  return useMutation({
    mutationFn: async ({
      supplierId: _supplierId,
      contractId: _contractId,
      policyId,
      isActive,
    }: ToggleContractPolicyStatusParams) => {
      setPoliciesStatus(policyId, true);
      const path = `/catalog/suppliers/contracts/cancellation-policies/${policyId}`;
      const url = isActive ? `${path}/deactivate` : `${path}/activate`;
      const response = await api.patch<ContractPolicyDto>(url);
      return normalizeContractPolicy(response);
    },
    onSuccess: async (_data, { contractId, policyId }) => {
      setPoliciesStatus(policyId, false);
      queryClient.setQueryData<ContractPolicy[]>(
        ["contract-cancellation-policies", contractId],
        (previous) =>
          previous?.map((p) =>
            p.id === policyId ? { ...p, isActive: !p.isActive } : p
          )
      );
      await queryClient.invalidateQueries({
        queryKey: ["contract-cancellation-policies", contractId],
      });
      await invalidateSupplierContractDetailQueries(queryClient, contractId);
    },
    onError: (error, { policyId }) => {
      setPoliciesStatus(policyId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdatePolicyStatus", { ns: "admin" })
        )
      );
    },
  });
}
