import type { ServiceRatesFilterState } from "@/features/filter-service-rates";

export interface ServiceRatesFiltersDraft {
  optionId: string | null;
  rateId: string | null;
  travelDateFrom: string | null;
  travelDateTo: string | null;
}

export function filterStateToDraft(
  state: ServiceRatesFilterState
): ServiceRatesFiltersDraft {
  return {
    optionId: state.optionIds[0] ?? null,
    rateId: state.rateIds[0] ?? null,
    travelDateFrom: state.travelDateFrom,
    travelDateTo: state.travelDateTo,
  };
}

export function draftToFiltersPatch(
  draft: ServiceRatesFiltersDraft
): import("@/features/filter-service-rates").ServiceRatesFiltersPatch {
  return {
    optionIds: draft.optionId ? [draft.optionId] : [],
    rateIds: draft.rateId ? [draft.rateId] : [],
    travelDateFrom: draft.travelDateFrom,
    travelDateTo: draft.travelDateTo,
    chargeTypes: [],
  };
}
