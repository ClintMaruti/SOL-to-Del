import { api, useQuery } from "@sol/api-client";

import {
  normalizeContractPolicy,
  type ContractPolicy,
  type ContractPolicyDto,
} from "../model/types";

export function useContractPolicies(contractId: string | null) {
  return useQuery<ContractPolicy[]>({
    queryKey: ["contract-cancellation-policies", contractId],
    queryFn: async () => {
      const data = await api.get<ContractPolicyDto[]>(
        `/catalog/suppliers/contracts/${contractId}/cancellation-policies`
      );
      return Array.isArray(data) ? data.map(normalizeContractPolicy) : [];
    },
    enabled: Boolean(contractId),
  });
}
