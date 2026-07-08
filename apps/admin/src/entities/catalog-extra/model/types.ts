/**
 * Catalog Extra row returned by list endpoints (supplier- or service-scoped).
 */
export interface CatalogExtra {
  id: string;
  title: string;
  /**
   * Legacy service-scoped list shape (Ticket 2 still uses it in some places).
   * Supplier-level extras should prefer `linkedServicesOptions`.
   */
  serviceId?: string;
  serviceName?: string;
  /**
   * Supplier-level list shape: linked services/options derived from ServiceExtras.
   * NULL service => ANY service; NULL option => ANY option.
   */
  linkedServicesOptions?: CatalogExtraLinkedServiceOption[];
  description: string | null;
  isActive: boolean;
  /** Drives the Mandatory/Optional treatment in the Extras tab. */
  extraType?: "Mandatory" | "Optional";
  /** Person → priced per selected guest; Unit → priced per quantity picked. */
  chargeType?: "Person" | "Unit";
  pricing?: {
    net: number;
    sell: number;
    rack: number;
  };
}

export interface CatalogExtraLinkedServiceOption {
  serviceId: string | null;
  serviceName: string | null;
  serviceOptionId: string | null;
  serviceOptionName: string | null;
}

export interface CatalogServiceExtra {
  id: string;
  serviceId: string | null;
  serviceName: string | null;
  serviceOptionId: string | null;
  serviceOptionName: string | null;
  /** ISO date string (yyyy-mm-dd) */
  validFrom: string;
  /** ISO date string (yyyy-mm-dd) */
  validTo: string | null;
  version?: number;
}

export type ExtraRequirementType = "mandatory" | "optional";

export type ExtraChargeType = "person" | "unit";

export type ExtraTimeUnit = "night" | "day" | "stay";

export type CatalogPaxType =
  | "Any"
  | "Adult"
  | "Child"
  | "Infant"
  | "Teen"
  | "Senior"
  | "Unknown";

/** Mirrors backend NoteDto */
export interface CatalogNoteDto {
  id: string;
  text: string;
  version: number;
}

/** Mirrors backend MoneyAmountDto (camelCase JSON) */
export interface CatalogMoneyAmountDto {
  amount: number;
  currency: string;
}

/** Mirrors backend ContractedExtraDto (GET `/contracted-extras`, PUT response). */
export interface CatalogContractedExtraDetail {
  id: string;
  contractId: string;
  /** Contract validity — UI-only unless present on legacy payloads. */
  validFrom?: string | null;
  validTo?: string | null;
  extraType: "Mandatory" | "Optional";
  chargeType: "Person" | "Unit";
  timeUnit: "None" | "Night" | "Day" | "Stay";
  /** BE primary travel range (flat on ContractedExtraDto). */
  travelFrom?: string | null;
  travelTo?: string | null;
  paxType?: CatalogPaxType | null;
  net: CatalogMoneyAmountDto | null;
  rack: CatalogMoneyAmountDto | null;
  sell: CatalogMoneyAmountDto | null;
  /** Normalized from flat fields for the travel-dates form UI. */
  travelDates?: CatalogContractedExtraTravelDateDto[];
  version: number;
}

export interface CatalogContractedExtraTravelDateDto {
  id: string;
  paxType: CatalogPaxType | null;
  /** ISO date string (yyyy-mm-dd) */
  travelFrom: string;
  /** ISO date string (yyyy-mm-dd) */
  travelTo: string;
  net: CatalogMoneyAmountDto | null;
  rack: CatalogMoneyAmountDto | null;
  sell: CatalogMoneyAmountDto | null;
}

/** Request body for PUT `/catalog/extras/:id` — mirrors BE `ContractedExtraItem`. */
export interface CatalogContractedExtraPutItem {
  id?: string | null;
  contractId: string;
  extraType: "Mandatory" | "Optional";
  chargeType: "Person" | "Unit";
  timeUnit: "Night" | "Day" | "Stay";
  travelFrom?: string | null;
  travelTo?: string | null;
  paxType?: CatalogPaxType | null;
  net?: number | null;
  rack?: number | null;
  sell?: number | null;
  version?: number | null;
}

export interface CatalogExtraPutBody {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  version: number;
  /** Optional linkage shortcut (General tab) — reconciles ServiceExtra rows on BE. */
  serviceIds?: string[];
  /** Omit when unchanged so the API does not interpret null as “no update” for notes. */
  notes?: CatalogNoteDto | null;
  contractedExtra: CatalogContractedExtraPutItem | null;
}

export interface CatalogExtraTravelDateRow {
  id: string;
  paxType?: CatalogPaxType | null;
  /** ISO date string (yyyy-mm-dd) */
  travelFrom: string;
  travelTo: string;
  /** Input strings in the UI layer; API uses decimals. */
  net: string;
  rack: string;
  sell: string;
}

/**
 * Full extra returned by GET /catalog/extras/:id and PUT response.
 */
export interface CatalogExtraDetail extends CatalogExtra {
  supplierId?: string;
  supplierName?: string;
  /** Concrete services linked via ServiceExtra rows (detail GET / PUT). */
  serviceIds?: string[];
  notes: CatalogNoteDto | null;
  version: number;
  /** Contract to scope GET `/contracted-extras` — detail GET does not embed contracted extra. */
  contractId?: string | null;
  /** Present on PUT response; load via GET `/contracted-extras` on detail page. */
  contractedExtra?: CatalogContractedExtraDetail | null;
  /** Supplier-level ServiceExtra rows from GET detail. */
  serviceExtras?: CatalogServiceExtra[];
}
