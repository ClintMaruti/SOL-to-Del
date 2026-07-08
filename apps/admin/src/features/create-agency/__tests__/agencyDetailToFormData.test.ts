import { describe, expect, it } from "vitest";

import type { AgencyDetail } from "@/entities/agency/model/types";

import { agencyDetailToFormData } from "../lib/agencyDetailToFormData";

function createAgencyDetail(overrides?: Partial<AgencyDetail>): AgencyDetail {
  return {
    id: "agency-1",
    name: "Test Agency",
    sourceMarketId: "UK",
    iataAgencyCode: "IATA1",
    email: "agency@test.com",
    number: "+1234567890",
    country: "Kenya",
    city: "Nairobi",
    postalCode: "00100",
    address: "123 Main St",
    website: "https://agency.test",
    kenXeroId: "ken-1",
    rwXeroId: "rw-1",
    tzXeroId: "tz-1",
    znzXeroId: "znz-1",
    paymentDepositPercent: 25,
    paymentBalanceDueDays: 30,
    paymentTaxCode: "VAT123",
    hasCreditTerms: true,
    creditNotes: "Net 30",
    requiresWhiteLabeling: false,
    whiteLabelingNote: "",
    visibilityForAgentZone: true,
    agentZoneId: "zone-1",
    agencyAffiliations: "IATA",
    additionalNotes: {
      id: "note-1",
      text: "Some notes",
      version: 1,
    },
    isActive: true,
    version: 0,
    agencyGroupIds: ["ag-1"],
    agencyGroups: [{ id: "ag-1", name: "Group A" }],
    assignedSafariPlannerId: "sp-01",
    assignedSafariPlannerName: "John Doe",
    agents: [],
    sourceMarketName: "Test Source Market",
    ...overrides,
  };
}

describe("agencyDetailToFormData", () => {
  it("maps full agency detail to form data", () => {
    const detail = createAgencyDetail();
    const result = agencyDetailToFormData(detail);

    expect(result.agencyName).toBe("Test Agency");
    expect(result.iataCode).toBe("IATA1");
    expect(result.agencyGroupIds).toEqual(["ag-1"]);
    expect(result.sourceMarket).toBe("UK");
    expect(result.assignedSafariPlannerId).toBe("sp-01");
    expect(result.assignedSafariPlannerName).toBe("John Doe");
    expect(result.email).toBe("agency@test.com");
    expect(result.phone).toBe("+1234567890");
    expect(result.country).toBe("Kenya");
    expect(result.city).toBe("Nairobi");
    expect(result.postalCode).toBe("00100");
    expect(result.streetAddress).toBe("123 Main St");
    expect(result.website).toBe("https://agency.test");
    expect(result.depositPercent).toBe("25");
    expect(result.balanceDueDays).toBe("30");
    expect(result.taxCode).toBe("VAT123");
    expect(result.hasCreditTerms).toBe(true);
    expect(result.creditTermsNote).toBe("Net 30");
    expect(result.needsWhiteLabel).toBe(false);
    expect(result.whiteLabelNote).toBe("");
    expect(result.agentZoneVisible).toBe(true);
    expect(result.agentZoneId).toBe("zone-1");
    expect(result.agencyAffiliations).toBe("IATA");
    expect(result.kenXeroId).toBe("ken-1");
    expect(result.rwXeroId).toBe("rw-1");
    expect(result.tzXeroId).toBe("tz-1");
    expect(result.znzXeroId).toBe("znz-1");
    expect(result.additionalNotes).toBe("Some notes");
  });

  it("uses name for agencyName in form", () => {
    const detail = createAgencyDetail({ name: "Fallback Name" });
    expect(agencyDetailToFormData(detail).agencyName).toBe("Fallback Name");
  });

  it("defaults optional string fields to empty string when undefined", () => {
    const minimal = createAgencyDetail({
      iataAgencyCode: "",
      number: "",
      country: "",
      city: "",
      postalCode: "",
      address: "",
      website: "",
      paymentTaxCode: "",
      creditNotes: "",
      whiteLabelingNote: "",
      agentZoneId: "",
      agencyAffiliations: "",
      kenXeroId: null,
      rwXeroId: null,
      tzXeroId: null,
      znzXeroId: null,
      additionalNotes: null,
      paymentDepositPercent: undefined,
      paymentBalanceDueDays: undefined,
    });

    const result = agencyDetailToFormData(minimal);
    expect(result.iataCode).toBe("");
    expect(result.phone).toBe("");
    expect(result.country).toBe("");
    expect(result.city).toBe("");
    expect(result.postalCode).toBe("");
    expect(result.streetAddress).toBe("");
    expect(result.website).toBe("");
    expect(result.depositPercent).toBe("");
    expect(result.balanceDueDays).toBe("");
    expect(result.taxCode).toBe("");
    expect(result.creditTermsNote).toBe("");
    expect(result.whiteLabelNote).toBe("");
    expect(result.agentZoneId).toBe("");
    expect(result.agencyAffiliations).toBe("");
    expect(result.kenXeroId).toBe("");
    expect(result.rwXeroId).toBe("");
    expect(result.tzXeroId).toBe("");
    expect(result.znzXeroId).toBe("");
    expect(result.additionalNotes).toBe("");
  });

  it("defaults boolean fields to false when undefined", () => {
    const minimal = createAgencyDetail({
      hasCreditTerms: false,
      requiresWhiteLabeling: false,
      visibilityForAgentZone: false,
    });

    const result = agencyDetailToFormData(minimal);
    expect(result.hasCreditTerms).toBe(false);
    expect(result.needsWhiteLabel).toBe(false);
    expect(result.agentZoneVisible).toBe(false);
  });

  it("maps assignedSafariPlannerId and assignedSafariPlannerName to form fields", () => {
    const detail = createAgencyDetail({
      assignedSafariPlannerId: "sp-02",
      assignedSafariPlannerName: "Jane Doe",
    });
    const result = agencyDetailToFormData(detail);
    expect(result.assignedSafariPlannerId).toBe("sp-02");
    expect(result.assignedSafariPlannerName).toBe("Jane Doe");
  });

  it("defaults assignedSafariPlannerId and assignedSafariPlannerName to empty string when missing", () => {
    const detail = createAgencyDetail({
      assignedSafariPlannerId: "",
      assignedSafariPlannerName: "",
    });
    const result = agencyDetailToFormData(detail);
    expect(result.assignedSafariPlannerId).toBe("");
    expect(result.assignedSafariPlannerName).toBe("");
  });
});
