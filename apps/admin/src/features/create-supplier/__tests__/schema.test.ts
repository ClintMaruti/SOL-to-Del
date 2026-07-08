import { describe, expect, it } from "vitest";

import {
  paymentTermEntrySchema,
  safeParseSupplierActivationFields,
  supplierSubmitSchema,
} from "../model/schema";

/** Minimal valid payload for supplier submit tests (AgentZone). */
const minimalValidSupplierPayload = {
  name: "Test Supplier",
  headOfficeId: "ho-1",
  code: "",
  additionalName: "",
  starRating: 0,
  serviceTypeId: "st-1",
  type: "Lodge",
  preferredSupplier: false,
  email: "test@example.com",
  phone: "",
  additionalEmail: "",
  secondAdditionalEmail: "",
  website: "",
  liveAvailabilityCheck: "",
  otherCommunicationChannels: "",
  countryId: "kenya",
  city: "",
  postalCode: "",
  streetAddress: "",
  poBox: "",
  locationId: "11111111-1111-1111-1111-111111111111",
  latitude: null,
  longitude: null,
  closestAirstrip: "",
  airstripLatitude: 0,
  airstripLongitude: 0,
  checkIn: "",
  checkOut: "",
  pickUp: "",
  dropOff: "",
  xeroId: "xero-123",
  paymentTerms: [
    {
      name: "General",
      travelDatesFrom: "",
      travelDatesTo: "",
      depositPercent: 20,
      balanceDueDays: 60,
    },
  ],
  taxCode: "Standard",
  visibilityForAgentZone: false,
  agentZoneId: "",
  isActive: true,
};

describe("paymentTermEntrySchema", () => {
  const baseInput = {
    name: "Standard Terms",
    travelDatesFrom: "",
    travelDatesTo: "",
  };

  describe("Travel Dates — format validation", () => {
    it("should accept both empty", () => {
      const result = paymentTermEntrySchema.parse(baseInput);
      expect(result.travelDatesFrom).toBe("");
      expect(result.travelDatesTo).toBe("");
    });

    it("should accept only travelDatesFrom provided", () => {
      const result = paymentTermEntrySchema.parse({
        ...baseInput,
        travelDatesFrom: "2025-03-15",
      });
      expect(result.travelDatesFrom).toBe("2025-03-15");
      expect(result.travelDatesTo).toBe("");
    });

    it("should accept only travelDatesTo provided", () => {
      const result = paymentTermEntrySchema.parse({
        ...baseInput,
        travelDatesTo: "2025-06-30",
      });
      expect(result.travelDatesFrom).toBe("");
      expect(result.travelDatesTo).toBe("2025-06-30");
    });

    it("should reject invalid date format on travelDatesFrom", () => {
      expect(() =>
        paymentTermEntrySchema.parse({
          ...baseInput,
          travelDatesFrom: "not-a-date",
          travelDatesTo: "",
        })
      ).toThrow(/Enter a valid date \(YYYY-MM-DD\)/);
    });

    it("should reject invalid date format on travelDatesTo", () => {
      expect(() =>
        paymentTermEntrySchema.parse({
          ...baseInput,
          travelDatesFrom: "",
          travelDatesTo: "invalid",
        })
      ).toThrow(/Enter a valid date \(YYYY-MM-DD\)/);
    });

    it("should accept valid ISO date strings", () => {
      const result = paymentTermEntrySchema.parse({
        ...baseInput,
        travelDatesFrom: "2025-01-01",
        travelDatesTo: "2025-12-31",
      });
      expect(result.travelDatesFrom).toBe("2025-01-01");
      expect(result.travelDatesTo).toBe("2025-12-31");
    });
  });

  describe("Travel Dates — cross-field validation", () => {
    it("should pass when travelDatesFrom < travelDatesTo", () => {
      const result = paymentTermEntrySchema.parse({
        ...baseInput,
        travelDatesFrom: "2025-03-01",
        travelDatesTo: "2025-03-15",
      });
      expect(result.travelDatesFrom).toBe("2025-03-01");
      expect(result.travelDatesTo).toBe("2025-03-15");
    });

    it("should pass when travelDatesFrom === travelDatesTo", () => {
      const result = paymentTermEntrySchema.parse({
        ...baseInput,
        travelDatesFrom: "2025-06-15",
        travelDatesTo: "2025-06-15",
      });
      expect(result.travelDatesFrom).toBe("2025-06-15");
      expect(result.travelDatesTo).toBe("2025-06-15");
    });

    it("should reject when travelDatesFrom > travelDatesTo and add errors to both fields", () => {
      const result = paymentTermEntrySchema.safeParse({
        ...baseInput,
        travelDatesFrom: "2025-12-31",
        travelDatesTo: "2025-01-01",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("travelDatesFrom");
        expect(paths).toContain("travelDatesTo");
        const fromIssue = result.error.issues.find(
          (i) => i.path[0] === "travelDatesFrom"
        );
        const toIssue = result.error.issues.find(
          (i) => i.path[0] === "travelDatesTo"
        );
        expect(fromIssue?.message).toMatch(
          /before or equal to Travel Dates To/
        );
        expect(toIssue?.message).toMatch(/after or equal to Travel Dates From/);
      }
    });
  });
});

describe("supplierSubmitSchema", () => {
  describe("Location — optional when empty; valid GUID when set", () => {
    it("should accept empty locationId for inactive draft", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        locationId: "",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty locationId when active", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        locationId: "",
        isActive: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === "locationId"
        );
        expect(issue).toBeDefined();
      }
    });

    it("should reject non-GUID locationId when non-empty", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        locationId: "not-a-guid",
        isActive: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === "locationId"
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toMatch(/select a location from the list/i);
      }
    });

    it("should accept a valid GUID locationId", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        locationId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locationId).toBe(
          "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        );
      }
    });
  });

  describe("Xero ID — optional on save and activate", () => {
    it("should accept empty xeroId when inactive", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        xeroId: "",
        isActive: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.xeroId).toBe("");
        expect(result.data.isActive).toBe(false);
      }
    });

    it("should reject empty xeroId when active if type, country, and location are set", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        xeroId: "",
        isActive: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === "xeroId");
        expect(issue).toBeDefined();
      }
    });
  });

  describe("Save — name, head office, service type required", () => {
    it("should reject inactive save when name is missing", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        name: "",
        isActive: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(
          true
        );
      }
    });

    it("should reject inactive save when headOfficeId is missing", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        headOfficeId: "",
        isActive: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path[0] === "headOfficeId")
        ).toBe(true);
      }
    });
  });

  describe("AgentZone — agentZoneId required when visible", () => {
    it("should pass when visibilityForAgentZone is false and agentZoneId is empty", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        visibilityForAgentZone: false,
        agentZoneId: "",
      });
      expect(result.success).toBe(true);
    });

    it("should pass when visibilityForAgentZone is true and agentZoneId is non-empty", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        visibilityForAgentZone: true,
        agentZoneId: "ID198419",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentZoneId).toBe("ID198419");
      }
    });

    it("should reject when visibilityForAgentZone is true and agentZoneId is empty", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        visibilityForAgentZone: true,
        agentZoneId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const agentZoneIssue = result.error.issues.find(
          (i) => i.path[0] === "agentZoneId"
        );
        expect(agentZoneIssue).toBeDefined();
        expect(agentZoneIssue?.message).toBe(
          "AgentZone ID is required when visible in AgentZone"
        );
      }
    });

    it("should reject when visibilityForAgentZone is true and agentZoneId is whitespace only", () => {
      const result = supplierSubmitSchema.safeParse({
        ...minimalValidSupplierPayload,
        visibilityForAgentZone: true,
        agentZoneId: "   ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const agentZoneIssue = result.error.issues.find(
          (i) => i.path[0] === "agentZoneId"
        );
        expect(agentZoneIssue).toBeDefined();
      }
    });
  });
});

describe("safeParseSupplierActivationFields", () => {
  const activationBase = {
    type: "Lodge",
    countryId: "kenya",
    locationId: "11111111-1111-1111-1111-111111111111",
    email: "test@example.com",
    xeroId: "xero-1",
  };

  it("should pass when type, country, location, email, and xeroId are set", () => {
    const result = safeParseSupplierActivationFields(activationBase);
    expect(result.success).toBe(true);
  });

  it("should fail when xeroId is empty", () => {
    const result = safeParseSupplierActivationFields({
      ...activationBase,
      xeroId: "",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when email is empty", () => {
    const result = safeParseSupplierActivationFields({
      ...activationBase,
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when countryId is empty", () => {
    const result = safeParseSupplierActivationFields({
      ...activationBase,
      countryId: "",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when locationId is empty", () => {
    const result = safeParseSupplierActivationFields({
      ...activationBase,
      locationId: "",
    });
    expect(result.success).toBe(false);
  });
});
