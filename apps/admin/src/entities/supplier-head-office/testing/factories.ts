import type { SupplierHeadOffice } from "../model/types";

/**
 * Factory function to create mock SupplierHeadOffice objects for testing
 */
export const createSupplierHeadOffice = (
  id: string,
  name: string,
  options?: Partial<Omit<SupplierHeadOffice, "id" | "name">>
): SupplierHeadOffice => ({
  id,
  name,
  email: options?.email ?? `${id}@test.com`,
  phoneNumber: options?.phoneNumber ?? "+1234567890",
  additionalEmail: options?.additionalEmail ?? null,
  website: options?.website ?? null,
  country: options?.country ?? null,
  city: options?.city ?? null,
  postalCode: options?.postalCode ?? null,
  streetAddress: options?.streetAddress ?? null,
  isActive: options?.isActive ?? true,
  suppliersCount: options?.suppliersCount ?? 0,
});
