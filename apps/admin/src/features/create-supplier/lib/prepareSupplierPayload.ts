import type { CreateSupplierFormData, PaymentTermEntry } from "../model/types";

/** Payment term shape for POST/PUT (empty travel dates as `null`). */
export type SupplierPaymentTermPayload = Omit<
  PaymentTermEntry,
  "travelDatesFrom" | "travelDatesTo"
> & {
  travelDatesFrom: string | null;
  travelDatesTo: string | null;
};

function emptyStringToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** POST/PUT `/catalog/suppliers` body — optional strings as `null`, not `""`. */
export type SupplierPayloadForApi = {
  name: string;
  headOfficeId: string;
  serviceTypeId: string;
  starRating: number;
  preferredSupplier: boolean;
  isActive: boolean;
  code: string | null;
  additionalName: string | null;
  type: string | null;
  email: string | null;
  phone: string | null;
  additionalEmail: string | null;
  secondAdditionalEmail: string | null;
  website: string | null;
  liveAvailabilityCheck: string | null;
  otherCommunicationChannels: string | null;
  countryId: string | null;
  city: string | null;
  postalCode: string | null;
  streetAddress: string | null;
  poBox: string | null;
  locationId: string | null;
  latitude: number | null;
  longitude: number | null;
  closestAirstrip: string | null;
  airstripLatitude: number | null;
  airstripLongitude: number | null;
  checkIn: string | null;
  checkOut: string | null;
  pickUp: string | null;
  dropOff: string | null;
  xeroId: string | null;
  paymentTerms: SupplierPaymentTermPayload[];
  taxCode: string | null;
  visibilityForAgentZone: boolean;
  agentZoneId: string | null;
};

function sanitizeLocationId(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    trimmed
  )
    ? trimmed
    : null;
}

function sanitizePaymentTerms(
  terms: CreateSupplierFormData["paymentTerms"]
): SupplierPaymentTermPayload[] {
  if (!terms?.length) return [];
  return terms.map((pt) => {
    const from = pt.travelDatesFrom;
    const to = pt.travelDatesTo;
    const name = pt.name.trim() ? pt.name.trim() : "Standard";
    return {
      ...pt,
      name,
      travelDatesFrom: typeof from === "string" && from.trim() ? from : null,
      travelDatesTo: typeof to === "string" && to.trim() ? to : null,
    };
  });
}

function parseOptionalCoord(
  v: string | number | null | undefined
): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  const s = String(v).trim();
  if (s === "") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/**
 * Maps form values to API payload: required save fields kept; other optional fields use `null` when empty.
 */
export function prepareSupplierPayloadForApi(
  payload: CreateSupplierFormData
): SupplierPayloadForApi {
  return {
    name: payload.name.trim(),
    headOfficeId: payload.headOfficeId,
    serviceTypeId: payload.serviceTypeId,
    starRating: payload.starRating,
    preferredSupplier: payload.preferredSupplier,
    isActive: payload.isActive,

    code: emptyStringToNull(payload.code),
    additionalName: emptyStringToNull(payload.additionalName),
    type: emptyStringToNull(payload.type),
    email: emptyStringToNull(payload.email),
    phone: emptyStringToNull(payload.phone),
    additionalEmail: emptyStringToNull(payload.additionalEmail),
    secondAdditionalEmail: emptyStringToNull(payload.secondAdditionalEmail),
    website: emptyStringToNull(payload.website),
    liveAvailabilityCheck: emptyStringToNull(payload.liveAvailabilityCheck),
    otherCommunicationChannels: emptyStringToNull(
      payload.otherCommunicationChannels
    ),

    countryId: emptyStringToNull(payload.countryId),
    city: emptyStringToNull(payload.city),
    postalCode: emptyStringToNull(payload.postalCode),
    streetAddress: emptyStringToNull(payload.streetAddress),
    poBox: emptyStringToNull(payload.poBox),
    locationId: sanitizeLocationId(payload.locationId),
    latitude: parseOptionalCoord(payload.latitude),
    longitude: parseOptionalCoord(payload.longitude),
    closestAirstrip: emptyStringToNull(payload.closestAirstrip),

    airstripLatitude: parseOptionalCoord(payload.airstripLatitude),
    airstripLongitude: parseOptionalCoord(payload.airstripLongitude),

    checkIn: emptyStringToNull(payload.checkIn),
    checkOut: emptyStringToNull(payload.checkOut),
    pickUp: emptyStringToNull(payload.pickUp),
    dropOff: emptyStringToNull(payload.dropOff),

    xeroId: emptyStringToNull(payload.xeroId),

    paymentTerms: sanitizePaymentTerms(payload.paymentTerms),
    taxCode: emptyStringToNull(payload.taxCode),
    visibilityForAgentZone: payload.visibilityForAgentZone,
    agentZoneId: emptyStringToNull(payload.agentZoneId),
  };
}
