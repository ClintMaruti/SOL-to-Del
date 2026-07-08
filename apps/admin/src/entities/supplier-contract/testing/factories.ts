import type { SupplierContract } from "../model/types";

export const createSupplierContract = (
  id: string,
  name: string,
  options?: Partial<Omit<SupplierContract, "id" | "name">>
): SupplierContract => ({
  id,
  name,
  link: options?.link ?? null,
  agencyGroupId: options?.agencyGroupId ?? null,
  agencyGroupName: options?.agencyGroupName ?? null,
  validFrom: options?.validFrom ?? "2025-01-01",
  validTo: options?.validTo ?? "2025-12-31",
  isActive: options?.isActive ?? false,
  createdAt: options?.createdAt ?? "2025-01-01T00:00:00Z",
  updatedAt: options?.updatedAt ?? "2025-01-01T00:00:00Z",
});
