import { describe, expect, it, vi } from "vitest";

import { parseSupplierSubmitForForm } from "../supplierFormSubmitErrors";

function createMockForm() {
  const fieldMeta: Record<string, unknown> = {};
  return {
    setFieldMeta: vi.fn((path: string, updater: (prev: unknown) => unknown) => {
      fieldMeta[path] = updater(fieldMeta[path]);
    }),
    getFieldMeta: (path: string) => fieldMeta[path],
  };
}

describe("parseSupplierSubmitForForm", () => {
  it("maps save-required Zod issues onto form fields", () => {
    const form = createMockForm();

    const result = parseSupplierSubmitForForm(form as never, {
      name: "",
      headOfficeId: "",
      serviceTypeId: "",
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
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldNames).toEqual(
        expect.arrayContaining(["name", "headOfficeId", "serviceTypeId"])
      );
    }

    const nameMeta = form.getFieldMeta("name") as {
      errorMap?: { onSubmit?: string };
    };
    const hoMeta = form.getFieldMeta("headOfficeId") as {
      errorMap?: { onSubmit?: string };
    };
    const stMeta = form.getFieldMeta("serviceTypeId") as {
      errorMap?: { onSubmit?: string };
    };

    expect(nameMeta?.errorMap?.onSubmit).toMatch(/name/i);
    expect(hoMeta?.errorMap?.onSubmit).toMatch(/head office/i);
    expect(stMeta?.errorMap?.onSubmit).toMatch(/primary service type/i);
  });
});
