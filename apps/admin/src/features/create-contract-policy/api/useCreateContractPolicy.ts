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

import type { CreatePolicyFormBody } from "../lib/prepareCreatePolicyRequest";
import { prepareCreatePolicyRequest } from "../lib/prepareCreatePolicyRequest";

export interface CreateContractPolicyPayload {
  supplierId: string;
  contractId: string;
  policyName: string;
  description: string;
  refundable: boolean;
  travelDates: {
    from: string;
    to: string | null;
  }[];
  conditions: {
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

type CreateContractPolicyResponse = ContractPolicyDto[] | ContractPolicyDto;

/** API returns all policies for the contract after create. */
export function useCreateContractPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      ...formBody
    }: CreateContractPolicyPayload) => {
      const body = prepareCreatePolicyRequest(formBody as CreatePolicyFormBody);
      const data = await api.post<CreateContractPolicyResponse>(
        `/catalog/suppliers/contracts/${contractId}/cancellation-policies`,
        body
      );
      const policies = Array.isArray(data) ? data : [data];
      return policies.map(normalizeContractPolicy);
    },
    onSuccess: (_data, variables) => {
      toast.success(i18n.t("modals.policyCreatedSuccess", { ns: "admin" }));
      void queryClient.invalidateQueries({
        queryKey: ["contract-cancellation-policies", variables.contractId],
      });
      void invalidateSupplierContractDetailQueries(
        queryClient,
        variables.contractId
      );
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(
        error,
        i18n.t("errors.failedToCreatePolicy", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
