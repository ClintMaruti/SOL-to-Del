export type ItinerariesFilterChipKey =
  | "agencyId"
  | "bookedById"
  | "dateFrom"
  | "dateTo"
  | "destinationId"
  | "createdOnFrom"
  | "createdOnTo"
  | "status"
  | "paymentStatus";

export interface ItinerariesFilterChip {
  key: ItinerariesFilterChipKey;
  label: string;
}

export interface ItinerariesDraftFilters {
  agencyId: string | null;
  agentId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  destinationId: string | null;
  createdOnFrom: string | null;
  createdOnTo: string | null;
  status: string | null;
  paymentStatus: string | null;
}
