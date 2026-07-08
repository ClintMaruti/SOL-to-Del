/** Wire shapes for catalog service-level contracted rates. */

export interface MoneyAmountDto {
  currency: string;
  value: number;
}

export interface ContractedRateDateApiDto {
  id: string;
  travelDateFrom: string;
  travelDateTo: string;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  weekdays: string[];
}

/** Nested option row returned by GET/POST/PUT contracted-rate endpoints. */
export interface ContractedRateOptionApiDto {
  id: string;
  serviceOptionId: string;
  rateId: string;
  net: MoneyAmountDto | null;
  rack: MoneyAmountDto | null;
  sell: MoneyAmountDto | null;
  version?: number;
}

/**
 * Aggregate contracted rate from API (one season/priority with shared dates and multiple options).
 */
export interface ContractedRateAggregateApiDto {
  id: string;
  contractId: string;
  seasonName: string;
  priority: number;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  version?: number;
  options: ContractedRateOptionApiDto[];
  dates: ContractedRateDateApiDto[];
}

/** Legacy flat row shape (MSW / older mocks). */
export interface ContractedRateFlatApiDto {
  id: string;
  contractId: string;
  rateId: string;
  serviceOptionId: string;
  seasonName: string;
  priority: number;
  net: MoneyAmountDto | null;
  rack: MoneyAmountDto | null;
  sell: MoneyAmountDto | null;
  version?: number;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  dates: ContractedRateDateApiDto[];
}

export type ContractedRateApiItem =
  | ContractedRateAggregateApiDto
  | ContractedRateFlatApiDto;

export interface ContractedRateDateItemRequest {
  id?: string | null;
  travelDateFrom: string;
  travelDateTo: string;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  weekdays: string[];
}

export interface ContractedRatePriceRowRequest {
  serviceOptionId: string;
  rateId: string;
  net: number | null;
  rack: number | null;
  sell: number | null;
}

export interface ContractedRateOptionItemRequest {
  id?: string | null;
  serviceOptionId: string;
  rateId: string;
  net: number | null;
  rack: number | null;
  sell: number | null;
}

export interface CreateContractedRatesRequestBody {
  contractId: string;
  seasonName: string;
  priority: number;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  dates: ContractedRateDateItemRequest[];
  priceRows: ContractedRatePriceRowRequest[];
}

export interface UpdateContractedRateRequestBody {
  seasonName: string;
  priority: number;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  options: ContractedRateOptionItemRequest[];
  dates: ContractedRateDateItemRequest[];
  version: number;
}

export interface ContractedRatesQueryParams {
  contractId: string;
  serviceOptionId?: string;
  rateId?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
}
