/** Contract validity window from supplier contracts list (GET .../contracts). */
export function contractValidityFromCatalog(
  contracts: ReadonlyArray<{ id: string; validFrom: string; validTo: string }>,
  contractId: string
): { validFrom: string; validTo: string } {
  const match = contracts.find((c) => c.id === contractId.trim());
  return {
    validFrom: match?.validFrom?.trim() ?? "",
    validTo: match?.validTo?.trim() ?? "",
  };
}
