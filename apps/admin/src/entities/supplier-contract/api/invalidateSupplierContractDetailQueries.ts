import type { QueryClient } from "@tanstack/react-query";

/**
 * Matches GET contract detail cache: ["supplier-contracts", supplierId | null, contractId].
 * supplierId varies (e.g. contract detail page vs rate plan section uses null); contractId is stable.
 */
export function isSupplierContractDetailQueryKey(
  queryKey: unknown,
  contractId: string
): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey.length === 3 &&
    queryKey[0] === "supplier-contracts" &&
    queryKey[2] === contractId
  );
}

/** Invalidate all cached contract-detail queries for this contract (any supplierId segment). */
export function invalidateSupplierContractDetailQueries(
  queryClient: QueryClient,
  contractId: string
): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) =>
      isSupplierContractDetailQueryKey(query.queryKey, contractId),
  });
}
