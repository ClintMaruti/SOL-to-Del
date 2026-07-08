import type { ContractedRateDateItemRequest } from "@/entities/contracted-rate";

import { validateTravelDateRanges } from "./contractedRateOverlap";

export type ContractedRatePriceRowValidationInput = {
  key: string;
  checked: boolean;
  net: string;
  rack: string;
};

export type ContractedRatePriceRowFieldErrors = {
  net?: string;
  rack?: string;
};

export type ContractedRateFormFieldErrors = {
  banner?: string;
  seasonName?: string;
  priority?: string;
  /** Per travel-date row message (undefined = no error on that row). */
  dateRows: Array<string | undefined>;
  /** Keyed by `optionId:rateId` price matrix row key. */
  priceRows: Record<string, ContractedRatePriceRowFieldErrors>;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface ValidateContractedRateFormInput {
  seasonName: string;
  priority: string;
  dates: ContractedRateDateItemRequest[];
  priceRows: ContractedRatePriceRowValidationInput[];
  requireNetRackOnCheckedRows: boolean;
  t: Translate;
}

function emptyErrors(dateCount: number): ContractedRateFormFieldErrors {
  return {
    dateRows: Array.from({ length: dateCount }, () => undefined),
    priceRows: {},
  };
}

/**
 * Runs all client-side checks for the contracted rate dialog.
 * Returns `null` when valid; otherwise a full error snapshot for the UI.
 */
export function validateContractedRateForm(
  input: ValidateContractedRateFormInput
): ContractedRateFormFieldErrors | null {
  const errors = emptyErrors(input.dates.length);
  let hasError = false;

  if (!input.seasonName.trim()) {
    errors.seasonName = input.t("validation.seasonNameRequired");
    hasError = true;
  }

  const priorityNum = Number(input.priority);
  if (Number.isNaN(priorityNum) || priorityNum < 1 || priorityNum > 100) {
    errors.priority = input.t("validation.priorityRange", { min: 1, max: 100 });
    hasError = true;
  }

  const travelRangeError = validateTravelDateRanges(input.dates);
  if (travelRangeError) {
    const message =
      travelRangeError === "ContractedRate_InvalidTravelDateRange"
        ? input.t("validation.travelDateFromBeforeTo")
        : input.t("validation.bookingWindowToBeforeTravelOrWithin");
    errors.dateRows = input.dates.map(() => message);
    hasError = true;
  } else {
    input.dates.forEach((row, index) => {
      const from = row.travelDateFrom?.trim() ?? "";
      const to = row.travelDateTo?.trim() ?? "";
      if (!from && !to) {
        errors.dateRows[index] = input.t("validation.travelDatesCannotBeEmpty");
        hasError = true;
      } else if (!from) {
        errors.dateRows[index] = input.t("validation.travelDateFromRequired");
        hasError = true;
      } else if (!to) {
        errors.dateRows[index] = input.t("validation.travelDateToRequired");
        hasError = true;
      }
    });
  }

  const selected = input.priceRows.filter((row) => row.checked);
  if (!selected.length) {
    errors.banner = input.t("serviceRates.selectAtLeastOnePriceRow");
    hasError = true;
  } else if (input.requireNetRackOnCheckedRows) {
    for (const row of selected) {
      const rowErrors: ContractedRatePriceRowFieldErrors = {};
      if (row.net.trim() === "") {
        rowErrors.net = input.t("validation.netRequired");
        hasError = true;
      }
      if (row.rack.trim() === "") {
        rowErrors.rack = input.t("validation.rackRequired");
        hasError = true;
      }
      if (rowErrors.net || rowErrors.rack) {
        errors.priceRows[row.key] = rowErrors;
      }
    }
  }

  return hasError ? errors : null;
}
