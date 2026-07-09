import type { ItineraryDetail } from "@/entities/itinerary";

export type GuestDrawerMode = "manage" | "assign";

export type Salutation = "Mrs" | "Ms" | "Mr";

export interface ManageGuestsValues {
  adultsCount: string;
  childrenCount: string;
  infantsCount: string;
  childrenAges: string[];
}

export interface AssignGuestValues {
  salutation: Salutation;
  firstName: string;
  lastName: string;
  group: string;
  dateOfBirth: string;
  age: string;
  internationalFlightDetails: string;
  dietaryRequirements: string;
  preferences: string;
  note: string;
}

export type GuestSlotKind = "lead" | "adult" | "child";

export interface GuestSlot {
  id: string;
  kind: GuestSlotKind;
  labelKey: "leadTraveler" | "adult" | "child";
  index: number;
  isLead: boolean;
}

export interface GuestDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: ItineraryDetail;
  onPaxSaved?: (values: Pick<
    ItineraryDetail,
    "adultsCount" | "childrenCount" | "infantsCount" | "childrenAges"
  >) => void;
}

export function createDefaultAssignGuest(
  itinerary: ItineraryDetail,
  slot: GuestSlot
): AssignGuestValues {
  const isLead = slot.isLead;
  const childAge =
    slot.kind === "child"
      ? itinerary.childrenAges[slot.index - 1]
      : undefined;

  return {
    salutation: "Mrs",
    firstName: isLead ? (itinerary.leadTravelerFirstName ?? "") : "",
    lastName: isLead ? (itinerary.leadTravelerLastName ?? "") : "",
    group: isLead ? (itinerary.leadTravelerLastName ?? "") : "",
    dateOfBirth: "",
    age: childAge != null ? String(childAge) : "",
    internationalFlightDetails: "",
    dietaryRequirements: "",
    preferences: "",
    note: "",
  };
}

export function createManageGuestsValues(
  itinerary: ItineraryDetail
): ManageGuestsValues {
  return {
    adultsCount: String(itinerary.adultsCount || 1),
    childrenCount: String(itinerary.childrenCount || 0),
    infantsCount: String(itinerary.infantsCount || 0),
    childrenAges: itinerary.childrenAges.map(String),
  };
}
