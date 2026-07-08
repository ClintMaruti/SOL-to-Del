/** Star rating enum: 0–5, default 0. Matches SOLCatalogApiEnumsStarRatinginteger */

export type CreateSupplierFormData = {
  // General Information
  name: string;
  headOfficeId: string;
  code: string;
  additionalName?: string;
  starRating: number;
  serviceTypeId: string;
  type: string;
  preferredSupplier: boolean;

  // Contacts
  email: string;
  phone: string;
  additionalEmail: string;
  secondAdditionalEmail: string;
  website: string;
  liveAvailabilityCheck: string;
  otherCommunicationChannels: string;

  // Address & Location (catalog Country location id)
  countryId: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  poBox: string;
  locationId: string | null;
  latitude: string | null;
  longitude: string | null;
  closestAirstrip: string;
  airstripLatitude: number | null;
  airstripLongitude: number | null;

  // General Policy
  checkIn: string;
  checkOut: string;
  pickUp: string;
  dropOff: string;

  // Finance
  xeroId: string;

  // Payment Terms
  paymentTerms: PaymentTermEntry[];

  // AgentZone
  visibilityForAgentZone: boolean;
  agentZoneId: string;

  taxCode: string;

  /** Whether the supplier is active. Part of form; submitted with PUT payload. */
  isActive: boolean;
};

export interface PaymentTermEntry {
  id?: string;
  name: string;
  travelDatesFrom: string;
  travelDatesTo: string;
  depositPercent: number;
  balanceDueDays: number;
  taxCode?: string;
  isActive?: boolean;
}
