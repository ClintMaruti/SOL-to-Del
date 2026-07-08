import type { ContractedRateDate } from "@/entities/service-option-rate";

export interface OptionRateTravelDateRemovalPlan {
  removeWholeContractedRateDate: boolean;
  nextContractedRateDates: ContractedRateDate[];
}

/**
 * Persisted option-rate travel dates are hydrated as one travel row per
 * `contractedRateDates` bucket. Deleting the only travel row in a bucket must
 * remove that whole bucket so save-time validation never sees `travelDates: []`.
 */
export function planOptionRateTravelDateRemoval(
  contractedRateDates: ContractedRateDate[],
  contractedRateDateIndex: number,
  travelDateIndex: number
): OptionRateTravelDateRemovalPlan {
  const targetDate = contractedRateDates[contractedRateDateIndex];
  const targetTravelDate = targetDate?.travelDates[travelDateIndex];

  if (!targetDate || !targetTravelDate) {
    return {
      removeWholeContractedRateDate: false,
      nextContractedRateDates: contractedRateDates,
    };
  }

  const nextContractedRateDates = contractedRateDates.flatMap(
    (date, dateIdx) => {
      if (dateIdx !== contractedRateDateIndex) {
        return [date];
      }

      const nextTravelDates = date.travelDates.filter(
        (_travelDate, idx) => idx !== travelDateIndex
      );

      if (nextTravelDates.length === 0) {
        return [];
      }

      return [{ ...date, travelDates: nextTravelDates }];
    }
  );

  return {
    removeWholeContractedRateDate: targetDate.travelDates.length === 1,
    nextContractedRateDates,
  };
}
