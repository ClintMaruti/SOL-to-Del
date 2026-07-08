import { describe, expect, it } from "vitest";

import { prepareSupplierPayloadForApi } from "../prepareSupplierPayload";
import type { CreateSupplierFormData } from "../../model/types";

const baseForm = {
  name: "Test Supplier",
  headOfficeId: "ho-1",
  serviceTypeId: "st-1",
  starRating: 0,
  preferredSupplier: false,
  isActive: false,
  code: "",
  additionalName: "",
  type: "",
  email: "",
  phone: "",
  additionalEmail: "",
  secondAdditionalEmail: "",
  website: "",
  liveAvailabilityCheck: "",
  otherCommunicationChannels: "",
  countryId: "",
  city: "",
  postalCode: "",
  streetAddress: "",
  poBox: "",
  locationId: "",
  latitude: "",
  longitude: "",
  closestAirstrip: "",
  airstripLatitude: 0,
  airstripLongitude: 0,
  checkIn: "",
  checkOut: "",
  pickUp: "",
  dropOff: "",
  xeroId: "",
  paymentTerms: [
    {
      name: "General",
      travelDatesFrom: "",
      travelDatesTo: "",
      depositPercent: 20,
      balanceDueDays: 60,
    },
  ],
  taxCode: "",
  visibilityForAgentZone: false,
  agentZoneId: "",
} satisfies CreateSupplierFormData;

describe("prepareSupplierPayloadForApi", () => {
  it("sends empty optional strings as null", () => {
    const payload = prepareSupplierPayloadForApi(baseForm);

    expect(payload.type).toBeNull();
    expect(payload.email).toBeNull();
    expect(payload.countryId).toBeNull();
    expect(payload.xeroId).toBeNull();
    expect(payload.code).toBeNull();
    expect(payload.city).toBeNull();
  });

  it("keeps non-empty optional values", () => {
    const payload = prepareSupplierPayloadForApi({
      ...baseForm,
      type: "Lodge",
      countryId: "kenya",
      email: "a@b.com",
    });

    expect(payload.type).toBe("Lodge");
    expect(payload.countryId).toBe("kenya");
    expect(payload.email).toBe("a@b.com");
  });

  it("sanitizes invalid locationId to null", () => {
    const payload = prepareSupplierPayloadForApi({
      ...baseForm,
      locationId: "not-a-guid",
    });

    expect(payload.locationId).toBeNull();
  });
});
