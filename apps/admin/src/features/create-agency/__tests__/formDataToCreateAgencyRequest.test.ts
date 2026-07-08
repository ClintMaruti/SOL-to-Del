import { describe, expect, it } from "vitest";

import { CATALOG_NOTE_NIL_ID } from "@/entities/catalog-extra";

import { formDataToCreateAgencyRequest } from "../api/formDataToCreateAgencyRequest";
import type { AgencySubmitData } from "../model/schema";

function createFormData(
  overrides?: Partial<AgencySubmitData>
): AgencySubmitData {
  return {
    agencyName: "Test Agency",
    iataCode: "IATA123",
    agencyGroupIds: ["Group A"],
    sourceMarket: "uk-market-id",
    assignedSafariPlannerId: "sp-01",
    assignedSafariPlannerName: "John Doe",
    email: "agency@test.com",
    phone: "+1234567890",
    country: "Kenya",
    city: "Nairobi",
    postalCode: "00100",
    streetAddress: "123 Main St",
    website: "https://agency.test",
    depositPercent: "25",
    balanceDueDays: "30",
    taxCode: "VAT123",
    hasCreditTerms: true,
    creditTermsNote: "Net 30",
    needsWhiteLabel: false,
    whiteLabelNote: "",
    agentZoneVisible: true,
    agentZoneId: "zone-1",
    agencyAffiliations: "IATA",
    kenXeroId: "ken-1",
    rwXeroId: "rw-1",
    tzXeroId: "tz-1",
    znzXeroId: "znz-1",
    additionalNotes: "Some notes",
    ...overrides,
  };
}

describe("formDataToCreateAgencyRequest", () => {
  it("maps form data to API request body", () => {
    const formData = createFormData();
    const result = formDataToCreateAgencyRequest(formData);

    expect(result.name).toBe("Test Agency");
    expect(result.agencyGroupIds).toEqual(["Group A"]);
    expect(result.sourceMarketId).toBe("uk-market-id");
    expect(result.assignedSafariPlannerId).toBe("sp-01");
    expect(result.assignedSafariPlannerName).toBe("John Doe");
    expect(result.iataAgencyCode).toBe("IATA123");
    expect(result.email).toBe("agency@test.com");
    expect(result.number).toBe("+1234567890");
    expect(result.country).toBe("Kenya");
    expect(result.city).toBe("Nairobi");
    expect(result.postalCode).toBe("00100");
    expect(result.address).toBe("123 Main St");
    expect(result.website).toBe("https://agency.test");
    expect(result.kenXeroId).toBe("ken-1");
    expect(result.rwXeroId).toBe("rw-1");
    expect(result.tzXeroId).toBe("tz-1");
    expect(result.znzXeroId).toBe("znz-1");
    expect(result.paymentDepositPercent).toBe(25);
    expect(result.paymentBalanceDueDays).toBe(30);
    expect(result.paymentTaxCode).toBe("VAT123");
    expect(result.hasCreditTerms).toBe(true);
    expect(result.creditNotes).toBe("Net 30");
    expect(result.requiresWhiteLabeling).toBe(false);
    expect(result.whiteLabelingNote).toBeNull();
    expect(result.visibilityForAgentZone).toBe(true);
    expect(result.agentZoneId).toBe("zone-1");
    expect(result.agencyAffiliations).toBe("IATA");
    expect(result.additionalNotes).toEqual({
      id: CATALOG_NOTE_NIL_ID,
      text: "Some notes",
      version: 0,
    });
  });

  it("preserves note id and version when updating from existing note", () => {
    const formData = createFormData({ additionalNotes: "Updated" });
    const result = formDataToCreateAgencyRequest(formData, {
      existingAdditionalNotes: {
        id: "note-existing",
        text: "Old",
        version: 5,
      },
    });
    expect(result.additionalNotes).toEqual({
      id: "note-existing",
      text: "Updated",
      version: 5,
    });
  });

  it("sends null additionalNotes when form notes are empty", () => {
    const formData = createFormData({ additionalNotes: "" });
    const result = formDataToCreateAgencyRequest(formData);
    expect(result.additionalNotes).toBeNull();
  });

  it("uses default numeric values when depositPercent is empty", () => {
    const formData = createFormData({
      depositPercent: "",
      balanceDueDays: "",
    });
    const result = formDataToCreateAgencyRequest(formData);

    expect(result.paymentDepositPercent).toBe(0);
    expect(result.paymentBalanceDueDays).toBe(0);
  });

  it("uses default numeric values when depositPercent is invalid", () => {
    const formData = createFormData({
      depositPercent: "not-a-number",
      balanceDueDays: "nope",
    });
    const result = formDataToCreateAgencyRequest(formData);

    expect(result.paymentDepositPercent).toBe(0);
    expect(result.paymentBalanceDueDays).toBe(0);
  });

  it("sends null for rwXeroId, tzXeroId, znzXeroId when empty", () => {
    const formData = createFormData({
      rwXeroId: "",
      tzXeroId: "",
      znzXeroId: "",
    });
    const result = formDataToCreateAgencyRequest(formData);

    expect(result.rwXeroId).toBeNull();
    expect(result.tzXeroId).toBeNull();
    expect(result.znzXeroId).toBeNull();
  });
});
