export const supplierPaxTypeSchedulesRootQueryKey = [
  "supplier-pax-type-schedules",
] as const;

export function supplierPaxTypeSchedulesQueryKey(
  supplierId: string | null | undefined
) {
  return [...supplierPaxTypeSchedulesRootQueryKey, supplierId ?? ""] as const;
}
