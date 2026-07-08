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

/** Public list row shape (matches admin `ItineraryListItem`). */
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
