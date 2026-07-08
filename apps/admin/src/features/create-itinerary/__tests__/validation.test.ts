import { describe, expect, it } from "vitest";

import {
  INITIAL_CREATE_ITINERARY_FORM_VALUES,
  agencySelectionValue,
  sanitizeLeadTravelerNameInput,
  validateCreateItineraryForm,
  type CreateItineraryFieldLabels,
  type CreateItineraryValidationContext,
  type CreateItineraryValidationMessages,
} from "../model/validation";

const labels: CreateItineraryFieldLabels = {
  crmReferenceNumber: "CRM Reference Number",
  agency: "Agency",
  travelDateFrom: "Date From",
  travelDateTo: "Date To",
  destination: "Destination",
  leadTravelerName: "Lead Traveler Name",
  adultsCount: "Adults",
  childrenCount: "Children",
  infantsCount: "Infants",
};

const messages: CreateItineraryValidationMessages = {
  required: (field) => `${field} required`,
  maxLength: (field, max) => `${field} max ${max}`,
  invalidDate: (field) => `${field} invalid`,
  dateToBeforeFrom: "date order",
  inactiveAgency: "inactive agency",
  inactiveAgent: "inactive agent",
  agentAgencyMismatch: "agent agency mismatch",
  destinationsRequired: "destination required",
  inactiveDestination: "inactive destination",
  integer: (field) => `${field} integer`,
  atLeastOne: (field) => `${field} at least one`,
  zeroOrGreater: (field) => `${field} zero or greater`,
};

const context: CreateItineraryValidationContext = {
  activeAgencyIds: new Set(["agency-2"]),
  activeAgentAgencyById: new Map([["agent-2", "agency-2"]]),
  activeDestinationIds: new Set(["kenya", "amboseli", "serengeti"]),
};

function validate(
  values: Partial<typeof INITIAL_CREATE_ITINERARY_FORM_VALUES>
) {
  return validateCreateItineraryForm(
    {
      ...INITIAL_CREATE_ITINERARY_FORM_VALUES,
      ...values,
    },
    context,
    labels,
    messages
  );
}

describe("validateCreateItineraryForm", () => {
  it("builds an agency-only payload and defaults optional pax counts to zero", () => {
    const result = validate({
      crmReferenceNumber: " AN1234 ",
      agencySelection: agencySelectionValue({ type: "agency", id: "agency-2" }),
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-03-10",
      destinations: ["kenya", "amboseli"],
      leadTravelerName: "   ",
      adultsCount: "2",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.payload).toEqual({
      mode: "new",
      agencyId: "agency-2",
      agentId: null,
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-03-10",
      adultsCount: 2,
      childrenCount: 0,
      infantsCount: 0,
      childrenAges: [],
    });
  });

  it("derives agencyId from a selected agent and preserves destination order", () => {
    const result = validate({
      crmReferenceNumber: "AN1234",
      agencySelection: agencySelectionValue({ type: "agent", id: "agent-2" }),
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-03-10",
      destinations: ["serengeti", "kenya", "amboseli"],
      leadTravelerName: " David Smith ",
      adultsCount: "2",
      childrenCount: "3",
      infantsCount: "1",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.payload.agencyId).toBe("agency-2");
    expect(result.payload.agentId).toBe("agent-2");
    expect(result.payload.leadTravelerFirstName).toBe("David");
    expect(result.payload.leadTravelerLastName).toBe("Smith");
  });

  it("keeps lead traveler name input to name text", () => {
    expect(sanitizeLeadTravelerNameInput("Ana-Maria O'Neil 42!")).toBe(
      "Ana-Maria O'Neil "
    );
  });

  it("sanitizes lead traveler name before building the payload", () => {
    const result = validate({
      crmReferenceNumber: "AN1234",
      agencySelection: agencySelectionValue({ type: "agency", id: "agency-2" }),
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-03-10",
      destinations: ["kenya"],
      leadTravelerName: " Ana-Maria O'Neil 42! ",
      adultsCount: "2",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.payload.leadTravelerFirstName).toBe("Ana-Maria");
    expect(result.payload.leadTravelerLastName).toBe("O'Neil");
  });

  it("rejects missing required fields", () => {
    const result = validate({});

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors).toMatchObject({
      crmReferenceNumber: "CRM Reference Number required",
      agencySelection: "Agency required",
      travelDateFrom: "Date From required",
      travelDateTo: "Date To required",
      destinations: "destination required",
      adultsCount: "Adults required",
    });
  });

  it("rejects Date To before Date From", () => {
    const result = validate({
      crmReferenceNumber: "AN1234",
      agencySelection: agencySelectionValue({ type: "agency", id: "agency-2" }),
      travelDateFrom: "2026-03-10",
      travelDateTo: "2026-03-01",
      destinations: ["kenya"],
      adultsCount: "2",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors.travelDateTo).toBe("date order");
  });

  it("rejects inactive agency, inactive destination, and invalid pax values", () => {
    const result = validate({
      crmReferenceNumber: "AN1234",
      agencySelection: agencySelectionValue({ type: "agency", id: "agency-1" }),
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-03-10",
      destinations: ["inactive-destination"],
      adultsCount: "0",
      childrenCount: "1.5",
      infantsCount: "-1",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors).toMatchObject({
      agencySelection: "inactive agency",
      destinations: "inactive destination",
      adultsCount: "Adults at least one",
      childrenCount: "Children integer",
      infantsCount: "Infants integer",
    });
  });
});
