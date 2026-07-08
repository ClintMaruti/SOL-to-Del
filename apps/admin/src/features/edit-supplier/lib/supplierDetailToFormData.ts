import type { SupplierDetail } from "@/entities/suppliers";
import { parseStarRating } from "@/entities/suppliers/model/types";

import type { CreateSupplierFormData } from "../../create-supplier/model/types";

/**
 * Map API supplier detail to form data for the shared supplier form (view/update).
 */
export function supplierDetailToFormData(
  detail: SupplierDetail
): CreateSupplierFormData {
  return {
    name: detail.name ?? "",
    headOfficeId: detail.headOfficeId ?? "",
    code: detail.code ?? "",
    additionalName: detail.additionalName ?? "",
    starRating: parseStarRating(detail.starRating),
    serviceTypeId: detail.serviceTypeId ?? "",
    type: detail.type ?? "",
    preferredSupplier: detail.preferredSupplier ?? false,

    email: detail.email ?? "",
    phone: detail.phone ?? "",
    additionalEmail: detail.additionalEmail ?? "",
    secondAdditionalEmail: detail.secondAdditionalEmail ?? "",
    website: detail.website ?? "",
    liveAvailabilityCheck: detail.liveAvailabilityCheck ?? "",
    otherCommunicationChannels: detail.otherCommunicationChannels ?? "",

    countryId: detail.countryId ?? "",
    city: detail.city ?? "",
    postalCode: detail.postalCode ?? "",
    streetAddress: detail.streetAddress ?? "",
    poBox: detail.poBox ?? "",
    locationId: detail.locationId ?? null,
    latitude: detail.latitude != null ? String(detail.latitude) : "",
    longitude: detail.longitude != null ? String(detail.longitude) : "",
    closestAirstrip: detail.closestAirstrip ?? "",
    airstripLatitude:
      typeof detail.airstripLatitude === "number" ? detail.airstripLatitude : 0,
    airstripLongitude:
      typeof detail.airstripLongitude === "number"
        ? detail.airstripLongitude
        : 0,

    checkIn: detail.checkIn ?? "",
    checkOut: detail.checkOut ?? "",
    pickUp: detail.pickUp ?? "",
    dropOff: detail.dropOff ?? "",

    xeroId: detail.xeroId ?? "",

    paymentTerms: (detail.paymentTerms ?? []).map((pt) => ({
      ...(typeof pt.id === "string" ? { id: pt.id } : {}),
      name: pt.name ?? "",
      travelDatesFrom: pt.travelDatesFrom ?? "",
      travelDatesTo: pt.travelDatesTo ?? "",
      depositPercent:
        typeof pt.depositPercent === "number" ? pt.depositPercent : 20,
      balanceDueDays:
        typeof pt.balanceDueDays === "number" ? pt.balanceDueDays : 60,
      ...(typeof pt.taxCode === "string" ? { taxCode: pt.taxCode } : {}),
      ...(typeof pt.isActive === "boolean" ? { isActive: pt.isActive } : {}),
    })),
    taxCode: detail.taxCode as string,

    visibilityForAgentZone: detail.visibilityForAgentZone ?? false,
    agentZoneId: detail.agentZoneId ?? "",
    isActive: detail.isActive ?? false,
  };
}
