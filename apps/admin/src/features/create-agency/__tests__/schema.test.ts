import { describe, expect, it } from "vitest";

import { agencySubmitSchema } from "../model/schema";

const validAgencyFormData = {
  agencyName: "Test Agency",
  sourceMarket: "uk-market-id",
  iataCode: "IATA123",
  agencyGroupIds: ["ag-1"],
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
};

describe("agencySubmitSchema agency groups", () => {
  it("accepts one or more distinct agency group IDs", () => {
    const result = agencySubmitSchema.safeParse({
      ...validAgencyFormData,
      agencyGroupIds: ["ag-1", "ag-2"],
    });

    expect(result.success).toBe(true);
  });

  it("requires at least one agency group ID", () => {
    const result = agencySubmitSchema.safeParse({
      ...validAgencyFormData,
      agencyGroupIds: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate agency group IDs", () => {
    const result = agencySubmitSchema.safeParse({
      ...validAgencyFormData,
      agencyGroupIds: ["ag-1", "ag-1"],
    });

    expect(result.success).toBe(false);
  });
});
