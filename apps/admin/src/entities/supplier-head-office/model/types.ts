/**
 * Frontend domain model for Supplier Head Office.
 */
export interface SupplierHeadOffice {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  additionalEmail: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  streetAddress: string | null;
  poBox?: string | null;
  isActive?: boolean;
  suppliersCount: number;
}
