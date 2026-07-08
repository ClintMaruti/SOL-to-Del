import type { ContractedRatesQueryParams } from "../model/api-types";

export function contractedRatesQueryKey(
  serviceId: string | null,
  params: ContractedRatesQueryParams | null
) {
  return [
    "contracted-rates",
    serviceId,
    params?.contractId ?? null,
    params?.serviceOptionId ?? null,
    params?.rateId ?? null,
    params?.travelDateFrom ?? null,
    params?.travelDateTo ?? null,
  ] as const;
}
