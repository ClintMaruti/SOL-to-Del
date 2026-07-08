import type { SupplierContract } from "./types";

/**
 * BR-3: Delete is offered only until the contract has dependent configuration.
 * Honors explicit `canDelete === false` from the API when present.
 * Otherwise derives visibility from policies. PAX configuration now lives at supplier level,
 * so it no longer blocks contract deletion.
 */
export function resolveSupplierContractCanDelete(
  contract: SupplierContract
): boolean {
  if (contract.canDelete === false) {
    return false;
  }

  const hasPolicies = (contract.policies?.length ?? 0) > 0;
  return !hasPolicies;
}
