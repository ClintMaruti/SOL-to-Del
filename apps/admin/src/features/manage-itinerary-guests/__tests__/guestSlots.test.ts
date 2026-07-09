import { describe, expect, it } from "vitest";

import type { ItineraryDetail } from "@/entities/itinerary";

import { buildGuestSlots } from "../model/guestSlots";

function createItinerary(
  overrides: Partial<ItineraryDetail> = {}
): ItineraryDetail {
  return {
    id: "itinerary-1",
    reference: "CPS26000001",
    title: "Safari",
    status: "DRAFT",
    travelDateFrom: "2026-08-01",
    travelDateTo: "2026-08-10",
    adultsCount: 2,
    childrenCount: 2,
    infantsCount: 0,
    childrenAges: [7, 12],
    agencyId: "agency-1",
    agencyName: "Agency",
    agentId: null,
    agentName: null,
    leadTravelerFirstName: "Jane",
    leadTravelerLastName: "Smith",
    safariPlannerName: null,
    salesSupportName: null,
    opsName: null,
    ...overrides,
  };
}

describe("buildGuestSlots", () => {
  it("includes lead traveler and remaining adults when lead name exists", () => {
    const slots = buildGuestSlots(createItinerary());

    expect(slots.map((slot) => slot.id)).toEqual([
      "lead-traveler",
      "adult-2",
      "child-1",
      "child-2",
    ]);
  });

  it("numbers adults from one when no lead traveler is set", () => {
    const slots = buildGuestSlots(
      createItinerary({
        leadTravelerFirstName: null,
        leadTravelerLastName: null,
        adultsCount: 2,
        childrenCount: 0,
      })
    );

    expect(slots.map((slot) => slot.id)).toEqual(["adult-1", "adult-2"]);
  });
});
