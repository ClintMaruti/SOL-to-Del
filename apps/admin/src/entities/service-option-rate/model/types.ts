import type {
  ContractedRateApiDto,
  MoneyAmount,
  ServiceOptionRateApiItem,
} from "./api-types";

export interface TravelDate {
  id?: string;
  travelDateFrom: string;
  travelDateTo: string;
  weekdays?: string;
}

export interface ContractedRateDate {
  travelDates: TravelDate[];
  weekdays?: string;
  version?: number;
}

/** Domain shape after mapping GET DTOs; omits wire-only / nested-residency on {@link ContractedRateApiDto}. */
export type ContractedRate = Pick<
  ContractedRateApiDto,
  | "id"
  | "contractId"
  | "priority"
  | "bookingWindowFrom"
  | "bookingWindowTo"
  | "rateId"
  | "isActive"
> & {
  /** Stable key for draft rows in the rate form (not persisted). */
  clientRowKey?: string;
  rack: MoneyAmount;
  net: MoneyAmount;
  sell: MoneyAmount | null;
  version?: number;
  contractedRateDates: ContractedRateDate[];
};

/**
 * Catalog GET rate normalized to a single `name` and API enum literals (matches POST/PUT).
 */
export type ServiceOptionRate = Omit<
  ServiceOptionRateApiItem,
  "rateName" | "contractedRates"
> & {
  name: string;
  contractedRates: ContractedRate[];
};

/** Alias for {@link ServiceOptionRate}. */
export type Rate = ServiceOptionRate;
