import type { ContractedRate } from "@/entities/service-option-rate";
import {
  contractValidityToBounds,
  contractedRateSchema,
  travelDateOutsideContractBounds,
  type RateContractValidity,
} from "@/features/manage-service-option-rates/model/schema";
import { getOverlappingTravelKeysAcrossContractedRates } from "@/features/manage-service-option-rates/model/travelDateOverlap";

export interface ContractedRateDateValidationResult {
  travelDateErrors: boolean[];
  travelDateContractValidityErrors: boolean[];
}

export interface ContractedRateValidationResult {
  hasPriorityError: boolean;
  hasNetError: boolean;
  hasRackError: boolean;
  hasBookingWindowError: boolean;
  /** True when this contracted rate has at least one travel row flagged by overlap detection. */
  hasTravelOverlapError: boolean;
  /** True when this contracted rate has at least one travel row outside the selected contract validity. */
  hasTravelContractValidityError: boolean;
  dateResults: ContractedRateDateValidationResult[];
}

export function hasAnyGroupError(
  result: ContractedRateValidationResult
): boolean {
  if (
    result.hasPriorityError ||
    result.hasNetError ||
    result.hasRackError ||
    result.hasBookingWindowError
  )
    return true;
  return result.dateResults.some((dr) => dr.travelDateErrors.some(Boolean));
}

export function hasAnyDateSectionError(
  result: ContractedRateValidationResult
): boolean {
  if (result.hasPriorityError || result.hasBookingWindowError) return true;
  return result.dateResults.some((dr) => dr.travelDateErrors.some(Boolean));
}

export function hasPriorityOrTravelDateTableError(
  results: ContractedRateValidationResult[]
): boolean {
  return results.some(
    (r) =>
      r.hasPriorityError ||
      r.dateResults.some((dr) => dr.travelDateErrors.some(Boolean))
  );
}

export function hasNetOrRackTableError(
  results: ContractedRateValidationResult[]
): boolean {
  return results.some((r) => r.hasNetError || r.hasRackError);
}

export function computeContractedRateErrors(
  rates: ContractedRate[],
  contractValidity?: RateContractValidity | null
): ContractedRateValidationResult[] {
  const contractBounds = contractValidityToBounds(contractValidity);
  const results = rates.map((cr) => {
    const hasPriorityValueError =
      !contractedRateSchema.shape.priority.safeParse(Number(cr.priority))
        .success;
    const hasPriorityError = hasPriorityValueError;

    const hasNetError =
      cr.net.value == null ||
      !Number.isFinite(cr.net.value) ||
      cr.net.value <= 0;
    const hasRackError =
      cr.rack.value == null ||
      !Number.isFinite(cr.rack.value) ||
      cr.rack.value <= 0;

    const bwFrom = cr.bookingWindowFrom;
    const bwTo = cr.bookingWindowTo;
    const hasBookingWindowError = !!bwFrom && !!bwTo && bwTo <= bwFrom;
    let hasTravelContractValidityError = false;

    const dateResults: ContractedRateDateValidationResult[] =
      cr.contractedRateDates.map((date) => {
        const travelDateContractValidityErrors = date.travelDates.map((td) => {
          const isOutsideContract = travelDateOutsideContractBounds(
            td,
            contractBounds
          );
          if (isOutsideContract) {
            hasTravelContractValidityError = true;
          }
          return isOutsideContract;
        });
        const travelDateErrors = date.travelDates.map((td) => {
          if (!td.travelDateFrom || !td.travelDateTo) return true;
          if (td.travelDateTo <= td.travelDateFrom) return true;
          if (travelDateOutsideContractBounds(td, contractBounds)) return true;
          return false;
        });

        return { travelDateErrors, travelDateContractValidityErrors };
      });

    return {
      hasPriorityError,
      hasNetError,
      hasRackError,
      hasBookingWindowError,
      hasTravelOverlapError: false,
      hasTravelContractValidityError,
      dateResults,
    };
  });

  for (const key of getOverlappingTravelKeysAcrossContractedRates(rates)) {
    const parts = key.split(":");
    if (parts.length !== 3) continue;
    const crIdx = Number(parts[0]);
    const dateIndex = Number(parts[1]);
    const travelIndex = Number(parts[2]);
    if (Number.isFinite(crIdx) && results[crIdx]) {
      results[crIdx].hasTravelOverlapError = true;
    }
    const dr = results[crIdx]?.dateResults[dateIndex];
    if (dr?.travelDateErrors[travelIndex] !== undefined) {
      dr.travelDateErrors[travelIndex] = true;
    }
  }

  return results;
}
