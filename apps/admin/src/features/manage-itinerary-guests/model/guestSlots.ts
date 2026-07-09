import type { ItineraryDetail } from "@/entities/itinerary";

import type { GuestSlot } from "./types";

export function buildGuestSlots(itinerary: ItineraryDetail): GuestSlot[] {
  const slots: GuestSlot[] = [];
  const hasLead =
    Boolean(itinerary.leadTravelerFirstName) ||
    Boolean(itinerary.leadTravelerLastName);

  if (hasLead) {
    slots.push({
      id: "lead-traveler",
      kind: "lead",
      labelKey: "leadTraveler",
      index: 1,
      isLead: true,
    });
  }

  const adultStart = hasLead ? 2 : 1;
  for (let i = adultStart; i <= itinerary.adultsCount; i += 1) {
    slots.push({
      id: `adult-${i}`,
      kind: "adult",
      labelKey: "adult",
      index: i,
      isLead: false,
    });
  }

  for (let i = 1; i <= itinerary.childrenCount; i += 1) {
    slots.push({
      id: `child-${i}`,
      kind: "child",
      labelKey: "child",
      index: i,
      isLead: false,
    });
  }

  return slots;
}
