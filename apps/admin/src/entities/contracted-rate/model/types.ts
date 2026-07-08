import type { ContractedRateDateApiDto, MoneyAmountDto } from "./api-types";

export type MoneyAmount = MoneyAmountDto;

export type ContractedRateDate = ContractedRateDateApiDto;

/** One option/rate price row within a contracted rate season (flattened for UI). */
export interface ContractedRate {
  /** Contracted-rate option row id (PUT options[].id). */
  id: string;
  /** Parent contracted rate aggregate id (PUT/DELETE path id). */
  contractedRateId: string;
  contractId: string;
  serviceOptionId: string;
  rateId: string;
  seasonName: string;
  priority: number;
  net: MoneyAmount | null;
  rack: MoneyAmount | null;
  sell: MoneyAmount | null;
  /** Optimistic concurrency on the parent contracted rate. */
  version: number;
  dates: ContractedRateDate[];
}

/** A group of contracted rate rows sharing the same season name, priority and travel-date signature. */
export interface ContractedRateSeasonGroup {
  key: string;
  seasonName: string;
  priority: number;
  dates: ContractedRateDate[];
  rows: ContractedRate[];
}
