/** Wire shapes for catalog service-level rates (identity only). */

export type ChargeTypeApi = "Person" | "Unit";

export type TimeUnitApi = "Night" | "Day" | "Stay" | "None";

export interface ServiceRateApiItem {
  id: string;
  serviceId: string;
  rateName: string;
  chargeType: ChargeTypeApi;
  timeUnit: TimeUnitApi;
  currency: string;
  version?: number;
}

export interface ServiceRateCreateRequestBody {
  name: string;
  chargeType: ChargeTypeApi;
  timeUnit: TimeUnitApi;
}

export type ServiceRateUpdateRequestBody = ServiceRateCreateRequestBody & {
  version: number;
};
