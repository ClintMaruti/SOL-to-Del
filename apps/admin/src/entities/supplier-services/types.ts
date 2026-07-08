export const SERVICE_TYPES = [
  { value: "accommodation", label: "Accommodation" },
  { value: "activity", label: "Activity" },
  { value: "transportation", label: "Transportation" },
  { value: "flight", label: "Flight" },
  { value: "fee", label: "Fee" },
  { value: "other", label: "Other" },
] as const;

export type ServiceTypeValue = (typeof SERVICE_TYPES)[number]["value"];

export function getServiceTypeLabel(value: string): string {
  return SERVICE_TYPES.find((st) => st.value === value)?.label ?? value;
}

export interface SupplierServiceOption {
  id: string;
  name: string;
  isActive: boolean;
  ratePlans: Array<{
    id: string;
    ratePlanName: string;
  }>;
}

export interface SupplierService {
  id: string;
  supplierId: string;
  name: string;
  serviceName?: string;
  alternativeName?: string;
  serviceTypeId: string;
  locationId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  description?: string;
  isActive: boolean;
  tags: string;
  options: SupplierServiceOption[];
  rates: Array<{
    id: string;
    rateName: string;
  }>;
  nominalSaleCode: string | null;
  purchaseNominalCode: string | null;
  createdAt: string;
  updatedAt: string;
  type: string;
}

export interface UpdateSupplierServicePayload {
  name: string;
  alternativeName?: string;
  description?: string;
  tags: string;
  isActive: boolean;
}

/** Plain-text note attached to a catalog service (GET /notes, PUT /note). */
export interface CatalogEntityNote {
  id: string;
  text: string;
  version: number;
}

export interface UpdateServiceNotePayload {
  text: string | null;
  version: number | null;
}
