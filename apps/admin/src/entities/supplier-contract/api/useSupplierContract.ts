import { api, useQuery } from "@sol/api-client";

import {
  normalizeContractPolicy,
  type ContractPolicyDto,
  type SupplierContract,
} from "../model/types";

interface SupplierContractDto extends Omit<SupplierContract, "policies"> {
  policies?: ContractPolicyDto[];
}

/**
 * Hook to fetch a single contract by contract ID.
 * Endpoint: GET /api/catalog/contracts/{contractId}
 */
export function useSupplierContract(
  supplierId: string | null,
  contractId: string | null
) {
  return useQuery<SupplierContract | null>({
    queryKey: ["supplier-contracts", supplierId, contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const data = await api.get<SupplierContractDto>(
        `/catalog/contracts/${contractId}`
      );
      return {
        ...data,
        policies: Array.isArray(data.policies)
          ? data.policies.map(normalizeContractPolicy)
          : undefined,
      };
    },
    enabled: Boolean(contractId),
  });
}
