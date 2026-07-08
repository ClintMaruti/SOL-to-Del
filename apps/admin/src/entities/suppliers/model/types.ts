/** Star rating enum: 0–5, default 0. Matches SOLCatalogApiEnumsStarRatinginteger */
export const STAR_RATING_VALUES = [0, 1, 2, 3, 4, 5] as const;
export type StarRating = (typeof STAR_RATING_VALUES)[number];

/** Maps `StarRating` enum member names when API serializes enums as strings. */
const STAR_RATING_ENUM_NAME_TO_VALUE: Record<string, StarRating> = {
  NotRated: 0,
  OneStar: 1,
  TwoStars: 2,
  ThreeStars: 3,
  FourStars: 4,
  FiveStars: 5,
};

/**
 * Coerce API `starRating` (number, numeric string, or enum name string) to 0–5.
 * GET/PATCH responses may return a string even when the client sends a number.
 */
export function parseStarRating(value: unknown): StarRating {
  if (value == null || value === "") return 0;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    const rounded = Math.round(value);
    return STAR_RATING_VALUES.includes(rounded as StarRating)
      ? (rounded as StarRating)
      : 0;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed in STAR_RATING_ENUM_NAME_TO_VALUE) {
      return STAR_RATING_ENUM_NAME_TO_VALUE[trimmed];
    }
    const n = Number(trimmed);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      const rounded = Math.round(n);
      return STAR_RATING_VALUES.includes(rounded as StarRating)
        ? (rounded as StarRating)
        : 0;
    }
  }
  return 0;
}

/** Normalize supplier detail after GET/POST/PUT when API types differ from runtime JSON. */
export function normalizeSupplierDetail(
  detail: SupplierDetail
): SupplierDetail {
  return {
    ...detail,
    starRating: parseStarRating(detail.starRating as unknown),
  };
}

/**
 * Frontend domain model for Supplier.
 * - GET /catalog/suppliers (list): returns headOfficeName, locationName (and id, name, code, email, phone, isActive).
 * - GET /catalog/suppliers?headOfficeId={guid}: same list shape, filtered to suppliers under that head office.
 * - GET /catalog/suppliers/:id (detail): does not return headOfficeName or locationName; use SupplierDetail for that response.
 * Fields are optional so both list and detail response shapes type-check.
 *
 * Length constraints (enforced by API/validation; not by this type):
 * - name: max 200
 * - code: max 50
 * - email: max 64
 * - phone: max 50
 */
export interface Supplier {
  id: string;
  name: string;

  /** Resolved head office name. Present on list endpoint; omitted on GET /catalog/suppliers/:id. */
  headOfficeName?: string;

  /** Resolved location name. Present on list endpoint; omitted on GET /catalog/suppliers/:id. */
  locationName?: string;

  /** Supplier code (generated on creation). Mandatory, unique. Max length 50. */
  code: string;

  email?: string;
  phone?: string;

  /** Whether the supplier is active in SOL/F. Mandatory. */
  isActive: boolean;

  /** Xero accounting ID when set; omitted or null when not (activation gating in UI). */
  xeroId?: string | null;

  paymentTermId?: string;

  /** Whether the supplier is marked as a preferred/starred supplier. Present on list endpoint. */
  preferredSupplier?: boolean;

  /** Seasonal closure start date (ISO date string). Present on list endpoint when applicable. */
  closedFrom?: string | null;

  /** Seasonal closure end date (ISO date string). Present on list endpoint when applicable. */
  closedTo?: string | null;

  /** Soft delete: when true, record is considered deleted. Omitted on GET /catalog/suppliers/:id. */
  isDeleted?: boolean;

  /** Set when soft-deleted; null otherwise. Omitted on GET /catalog/suppliers/:id. */
  deletedAt?: string | null;

  /** User/system that performed soft delete; optional per project convention. */
  deletedBy?: string;
}

/** Payment term as returned by GET /catalog/suppliers/:id (and list). */
export interface SupplierPaymentTerm {
  id?: string;
  supplierId?: string;
  name?: string;
  travelDatesFrom?: string | null;
  travelDatesTo?: string | null;
  depositPercent?: number;
  balanceDueDays?: number;
  taxCode?: string;
  isActive?: boolean;
  version?: number;
}

/** Full supplier detail for view/update (GET /catalog/suppliers/:id). Aligned with API response. */
export interface SupplierDetail extends Supplier {
  additionalName?: string;
  starRating?: number;
  serviceTypeId?: string;
  type?: string;
  preferredSupplier?: boolean;

  additionalEmail?: string;
  secondAdditionalEmail?: string;
  website?: string;
  liveAvailabilityCheck?: string;
  otherCommunicationChannels?: string;

  headOfficeId: string;

  /** Catalog Country location id (GET/PUT/POST align with API `countryId`). */
  countryId: string;
  /** Present on supplier detail when API returns it. */
  countryIsPreferred?: boolean;
  city: string;
  postalCode: string;
  streetAddress: string;
  poBox?: string | null;
  locationId: string | null;
  latitude: number | null;
  longitude: number | null;
  closestAirstrip: string;
  /** API returns number (e.g. 0); legacy/form may use string. */
  airstripLatitude: number | string;
  /** API returns number (e.g. 0); legacy/form may use string. */
  airstripLongitude: number | string;

  checkIn?: string;
  checkOut?: string;
  pickUp?: string;
  dropOff?: string;

  nominalSaleCode?: string;
  purchaseNominalCode?: string;
  xeroId?: string;

  paymentTerms?: SupplierPaymentTerm[];
  taxCode?: string;

  visibilityForAgentZone?: boolean;
  agentZoneId?: string;

  lastUpdated?: string;
  lastUpdatedBy?: string;

  /** Concurrency version from API. */
  version?: number;
}
