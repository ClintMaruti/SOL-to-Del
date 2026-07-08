/**
 * Stable identity for a contracted-rate row: persisted `id`, client-only key, or index fallback.
 * Index fallback is only for legacy/test shapes; new rows should use {@link createEmptyContractedRate}.
 */
export function getContractedRateRowKey(
  cr: { id?: string; clientRowKey?: string },
  rowIndex: number
): string {
  if (cr.clientRowKey) return cr.clientRowKey;
  if (cr.id) return cr.id;
  return `__row-${rowIndex}`;
}
