export type ItineraryStatus =
  | "DRAFT"
  | "PREPARED"
  | "QUOTED"
  | "APPROVED"
  | "INVOICED"
  | "VOUCHERED"
  | "CONFIRMED"
  | "TRAVEL_IN_PROGRESS"
  | "COMPLETED"
  | "LOST"
  | "CANCELLED"
  | "SUPERSEDED";

export type PaymentStatus =
  | "UNPAID"
  | "DEPOSIT_PAID"
  | "PARTIALLY_PAID"
  | "FULLY_PAID"
  | "OVERPAID"
  | "REFUND_PENDING";

/** Columns the list may sort by (Agency/Agent & Safari Planner excluded per BR-13). */
export type ItinerarySortField =
  | "reference"
  | "title"
  | "travelDateFrom"
  | "status"
  | "paymentStatus"
  | "total"
  | "balance"
  | "updatedAt";

export type ItinerariesSearchSortByApi =
  | "None"
  | "Reference"
  | "Title"
  | "TravelDateFrom"
  | "Status"
  | "PaymentStatus"
  | "Total"
  | "Balance"
  | "UpdatedAt";

export type ItinerariesSearchSortDirectionApi = "Asc" | "Desc";

export interface ItineraryListItem {
  id: string;
  reference: string;
  title: string | null;
  agency: string;
  agent: string | null;
  safariPlanner: string;
  travelDateFrom: string;
  travelDateTo: string | null;
  status: ItineraryStatus;
  paymentStatus: PaymentStatus;
  totalUsd: number;
  balanceUsd: number;
  updatedAt: string;
  createdAt: string;
  version: number;
}

export interface CreateItineraryPayload {
  mode: "new" | "existing";
  inquiryId?: string;
  title?: string;
  agencyId: string;
  agentId: string | null;
  leadTravelerFirstName?: string;
  leadTravelerLastName?: string;
  travelDateFrom: string;
  travelDateTo?: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  childrenAges: number[];
}

export interface ItinerariesListQueryInput {
  search?: string;
  hideCompleted?: boolean;
  sort?: ItinerarySortField | null;
  order?: "asc" | "desc";
  agencyId?: string | null;
  bookedById?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  destinationId?: string | null;
  createdOnFrom?: string | null;
  createdOnTo?: string | null;
  statuses?: string[] | null;
  paymentStatus?: string | null;
}

export interface ItinerariesListResponse {
  items: ItineraryListItem[];
  total: number;
}

export interface ItineraryDetail {
  id: string;
  reference: string;
  title: string | null;
  status: ItineraryStatus;
  travelDateFrom: string;
  travelDateTo: string | null;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  childrenAges: number[];
  agencyId: string;
  agencyName: string;
  agentId: string | null;
  agentName: string | null;
  leadTravelerFirstName: string | null;
  leadTravelerLastName: string | null;
  safariPlannerName: string | null;
  salesSupportName: string | null;
  opsName: string | null;
}
