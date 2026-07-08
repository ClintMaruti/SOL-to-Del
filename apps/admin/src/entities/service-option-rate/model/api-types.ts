/**
 * Wire shapes for catalog GET/POST/PUT service option rates.
 * Normalized {@link ServiceOptionRate} maps `rateName` → domain `name`.
 */

export type ChargeTypeApi = "Person" | "Unit";

export type TimeUnitApi = "Night" | "Day" | "Stay" | "None";

/** Money fields on catalog GET/POST/PUT contracted rate DTOs. */
export interface MoneyAmount {
  currency: string;
  value: number;
}

/** Flat row in `contractedRateDates` (GET/POST/PUT response and mutation bodies). */
export interface ContractedRateDateWireDto {
  id?: string | null;
  travelDateFrom: string;
  travelDateTo: string;
  weekdays?: string[];
  version?: number;
}

/** Contracted rate as returned on GET/POST/PUT rate responses. */
export interface ContractedRateApiDto {
  id: string;
  contractId: string;
  rack: MoneyAmount;
  net: MoneyAmount;
  sell: MoneyAmount | null;
  priority: number;
  bookingWindowFrom: string;
  bookingWindowTo: string;
  contractedRateDates: ContractedRateDateWireDto[];
  /** Present on some catalog payloads; omitted in minimal OpenAPI examples. */
  rateId?: string;
  residency?: string;
  isActive?: boolean;
  version?: number;
}

export interface ServiceOptionRateApiItem {
  id: string;
  serviceOptionId: string;
  rateName: string;
  chargeType: ChargeTypeApi;
  timeUnit: TimeUnitApi;
  currency: string;
  version?: number;
  /** Present on some catalog payloads. */
  isActive?: boolean;
  contractedRates: ContractedRateApiDto[];
}

export interface ContractedRateMutationRequest {
  id?: string | null;
  contractId: string;
  rack: number;
  net: number;
  sell: number | null;
  priority: number;
  bookingWindowFrom: string | null;
  bookingWindowTo: string | null;
  contractedRateDates: ContractedRateDateWireDto[];
}

export interface ServiceOptionRateMutationRequestBody {
  name: string;
  chargeType: ChargeTypeApi;
  timeUnit: TimeUnitApi;
  contractedRates: ContractedRateMutationRequest[];
}

/** Backend PUT body: same as POST plus optimistic concurrency `version`. */
export type ServiceOptionRateUpdateRequestBody =
  ServiceOptionRateMutationRequestBody & { version: number };
