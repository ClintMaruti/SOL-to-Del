import { describe, expect, it } from "vitest";

import { toCreateItineraryFormErrors } from "../model/apiValidationErrors";

describe("toCreateItineraryFormErrors", () => {
  it("maps backend field errors to create itinerary form fields", () => {
    expect(
      toCreateItineraryFormErrors({
        CRMReferenceNumber: ["CRM reference is required."],
        AgencyId: ["Agency is required."],
        AgentId: ["Agent does not belong to agency."],
        TravelDateFrom: ["Date From is required."],
        TravelDateTo: ["Date To must be after Date From."],
        Destinations: ["Destination is required."],
        LeadTravelerName: ["Lead traveler is too long."],
        AdultsCount: ["Adults must be at least 1."],
        ChildrenCount: ["Children must be zero or greater."],
        InfantsCount: ["Infants must be zero or greater."],
      })
    ).toEqual({
      crmReferenceNumber: "CRM reference is required.",
      agencySelection: "Agency is required.",
      travelDateFrom: "Date From is required.",
      travelDateTo: "Date To must be after Date From.",
      destinations: "Destination is required.",
      leadTravelerName: "Lead traveler is too long.",
      adultsCount: "Adults must be at least 1.",
      childrenCount: "Children must be zero or greater.",
      infantsCount: "Infants must be zero or greater.",
    });
  });
});
