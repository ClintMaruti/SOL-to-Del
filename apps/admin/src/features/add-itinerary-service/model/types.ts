export type ServiceType =
  | "ACCOMMODATION"
  | "ACTIVITY"
  | "TRANSPORT"
  | "FLIGHT"
  | "OTHERS"
  | "FEE";

export interface AddServiceExtraPayload {
  catalogExtraId: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface AddServicePayload {
  type: ServiceType;
  supplierId: string;
  name: string;
  startDate: string;
  endDate: string;
  qty: number;
  extras: AddServiceExtraPayload[];
}

export interface ItineraryServiceItem {
  id: string;
  itineraryId: string;
  type: ServiceType;
  supplierId: string;
  supplierName: string;
  name: string;
  startDate: string;
  endDate: string;
  qty: number;
  status: "NEW" | "CONFIRMED" | "CANCELLED";
}
