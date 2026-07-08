export const supplierCloseoutsRootQueryKey = ["supplier-closeouts"] as const;

export function supplierCloseoutsQueryKey(
  supplierId: string | null | undefined,
  serviceId?: string | null
) {
  return serviceId
    ? ([...supplierCloseoutsRootQueryKey, supplierId, { serviceId }] as const)
    : ([...supplierCloseoutsRootQueryKey, supplierId] as const);
}
