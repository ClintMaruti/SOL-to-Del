import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { ContractedRate } from "@/entities/contracted-rate";
import type { ContractedRatesQueryParams } from "@/entities/contracted-rate";
import type { ChargeTypeApi, ServiceRate } from "@/entities/service-rate";

const CONTRACT_PARAM = "contractId";
const OPTION_IDS_PARAM = "optionIds";
const RATE_IDS_PARAM = "rateIds";
const TRAVEL_FROM_PARAM = "travelDateFrom";
const TRAVEL_TO_PARAM = "travelDateTo";
const CHARGE_TYPES_PARAM = "chargeTypes";

/** @deprecated legacy single-value params — read for URL backward compatibility */
const LEGACY_OPTION_PARAM = "serviceOptionId";
const LEGACY_RATE_PARAM = "rateId";

function parseCsvIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseChargeTypes(raw: string | null): ChargeTypeApi[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ChargeTypeApi => s === "Person" || s === "Unit");
}

export interface ServiceRatesFilterState {
  contractId: string | null;
  optionIds: string[];
  rateIds: string[];
  travelDateFrom: string | null;
  travelDateTo: string | null;
  chargeTypes: ChargeTypeApi[];
}

export interface ServiceRatesFiltersPatch {
  optionIds?: string[];
  rateIds?: string[];
  travelDateFrom?: string | null;
  travelDateTo?: string | null;
  chargeTypes?: ChargeTypeApi[];
}

export function applyClientContractedRateFilters(
  rows: ContractedRate[],
  filters: Pick<
    ServiceRatesFilterState,
    "optionIds" | "rateIds" | "chargeTypes"
  >,
  rates: ServiceRate[]
): ContractedRate[] {
  let result = rows;

  if (filters.optionIds.length > 0) {
    const optionSet = new Set(filters.optionIds);
    result = result.filter((r) => optionSet.has(r.serviceOptionId));
  }

  if (filters.rateIds.length > 0) {
    const rateSet = new Set(filters.rateIds);
    result = result.filter((r) => rateSet.has(r.rateId));
  }

  if (filters.chargeTypes.length > 0) {
    const allowedRateIds = new Set(
      rates
        .filter((r) => filters.chargeTypes.includes(r.chargeType))
        .map((r) => r.id)
    );
    result = result.filter((r) => allowedRateIds.has(r.rateId));
  }

  return result;
}

export function useServiceRatesFilters(rates: ServiceRate[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const contractId = searchParams.get(CONTRACT_PARAM);
  const optionIdsRaw =
    searchParams.get(OPTION_IDS_PARAM) ?? searchParams.get(LEGACY_OPTION_PARAM);
  const rateIdsRaw =
    searchParams.get(RATE_IDS_PARAM) ?? searchParams.get(LEGACY_RATE_PARAM);
  const travelDateFrom = searchParams.get(TRAVEL_FROM_PARAM);
  const travelDateTo = searchParams.get(TRAVEL_TO_PARAM);
  const chargeTypesRaw = searchParams.get(CHARGE_TYPES_PARAM);

  const optionIds = useMemo(() => parseCsvIds(optionIdsRaw), [optionIdsRaw]);
  const rateIds = useMemo(() => parseCsvIds(rateIdsRaw), [rateIdsRaw]);
  const chargeTypes = useMemo(
    () => parseChargeTypes(chargeTypesRaw),
    [chargeTypesRaw]
  );

  const setContractId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set(CONTRACT_PARAM, id);
          else next.delete(CONTRACT_PARAM);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const applyFilters = useCallback(
    (patch: ServiceRatesFiltersPatch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(LEGACY_OPTION_PARAM);
          next.delete(LEGACY_RATE_PARAM);

          if (patch.optionIds !== undefined) {
            if (patch.optionIds.length) {
              next.set(OPTION_IDS_PARAM, patch.optionIds.join(","));
            } else {
              next.delete(OPTION_IDS_PARAM);
            }
          }

          if (patch.rateIds !== undefined) {
            if (patch.rateIds.length) {
              next.set(RATE_IDS_PARAM, patch.rateIds.join(","));
            } else {
              next.delete(RATE_IDS_PARAM);
            }
          }

          if (patch.travelDateFrom !== undefined) {
            if (patch.travelDateFrom) {
              next.set(TRAVEL_FROM_PARAM, patch.travelDateFrom);
            } else {
              next.delete(TRAVEL_FROM_PARAM);
            }
          }

          if (patch.travelDateTo !== undefined) {
            if (patch.travelDateTo) {
              next.set(TRAVEL_TO_PARAM, patch.travelDateTo);
            } else {
              next.delete(TRAVEL_TO_PARAM);
            }
          }

          if (patch.chargeTypes !== undefined) {
            if (patch.chargeTypes.length) {
              next.set(CHARGE_TYPES_PARAM, patch.chargeTypes.join(","));
            } else {
              next.delete(CHARGE_TYPES_PARAM);
            }
          }

          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(OPTION_IDS_PARAM);
        next.delete(RATE_IDS_PARAM);
        next.delete(LEGACY_OPTION_PARAM);
        next.delete(LEGACY_RATE_PARAM);
        next.delete(TRAVEL_FROM_PARAM);
        next.delete(TRAVEL_TO_PARAM);
        next.delete(CHARGE_TYPES_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const removeFilterChip = useCallback(
    (key: ServiceRatesFilterChipKey) => {
      switch (key) {
        case "options":
          applyFilters({ optionIds: [] });
          break;
        case "rates":
          applyFilters({ rateIds: [] });
          break;
        case "chargeTypes":
          applyFilters({ chargeTypes: [] });
          break;
        case "travelDateFrom":
          applyFilters({ travelDateFrom: null });
          break;
        case "travelDateTo":
          applyFilters({ travelDateTo: null });
          break;
        default: {
          const _exhaustive: never = key;
          return _exhaustive;
        }
      }
    },
    [applyFilters]
  );

  const apiQueryParams = useMemo((): ContractedRatesQueryParams | null => {
    if (!contractId) return null;
    const params: ContractedRatesQueryParams = { contractId };
    if (optionIds[0]) params.serviceOptionId = optionIds[0];
    if (rateIds[0]) params.rateId = rateIds[0];
    if (travelDateFrom) params.travelDateFrom = travelDateFrom;
    if (travelDateTo) params.travelDateTo = travelDateTo;
    return params;
  }, [contractId, optionIds, rateIds, travelDateFrom, travelDateTo]);

  const filterState: ServiceRatesFilterState = {
    contractId,
    optionIds,
    rateIds,
    travelDateFrom,
    travelDateTo,
    chargeTypes,
  };

  const clientFilterRows = useCallback(
    (rows: ContractedRate[]) =>
      applyClientContractedRateFilters(rows, filterState, rates),
    [filterState, rates]
  );

  const hasActiveFilters =
    optionIds.length > 0 ||
    rateIds.length > 0 ||
    chargeTypes.length > 0 ||
    Boolean(travelDateFrom) ||
    Boolean(travelDateTo);

  return {
    filterState,
    apiQueryParams,
    hasActiveFilters,
    clientFilterRows,
    setContractId,
    applyFilters,
    clearAllFilters,
    removeFilterChip,
  };
}

export type ServiceRatesFilterChipKey =
  | "options"
  | "rates"
  | "chargeTypes"
  | "travelDateFrom"
  | "travelDateTo";

export interface ServiceRatesFilterChip {
  key: ServiceRatesFilterChipKey;
  label: string;
}
