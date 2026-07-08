import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  invalidateSupplierContractDetailQueries,
  normalizeContractPolicy,
  type ContractPolicyDto,
  type PenaltyType,
  type ReferenceEvent,
  type Starts,
} from "@/entities/supplier-contract";

import type { UpdatePolicyFormBody } from "../lib/prepareUpdatePolicyRequest";
import { prepareUpdatePolicyRequest } from "../lib/prepareUpdatePolicyRequest";

export interface UpdateContractPolicyPayload {
  supplierId: string;
  contractId: string;
  policyId: string;
  /** Current active state; sent in request body. */
  isActive: boolean;
  policyName: string;
  description: string;
  refundable: boolean;
  travelDates: {
    id?: string;
    version?: number;
    from: string;
    to: string | null;
  }[];
  conditions: {
    id?: string;
    starts: Starts;
    referenceEvent: ReferenceEvent;
    startDay: number;
    startTime: string;
    endDay: number;
    endTime: string;
    penaltyValue: number;
    penaltyType: PenaltyType;
  }[];
}

export function useUpdateContractPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      policyId,
      isActive,
      ...formBody
    }: UpdateContractPolicyPayload) => {
      const body = prepareUpdatePolicyRequest(
        formBody as UpdatePolicyFormBody,
        isActive,
        policyId,
        contractId
      );
      const data = await api.put<ContractPolicyDto>(
        `/catalog/suppliers/contracts/cancellation-policies/${policyId}`,
        body
      );
      return normalizeContractPolicy(data);
    },
    onSuccess: async (_data, variables) => {
      toast.success(i18n.t("modals.policyUpdatedSuccess", { ns: "admin" }));
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
        i18n.t("errors.failedToUpdatePolicy", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
