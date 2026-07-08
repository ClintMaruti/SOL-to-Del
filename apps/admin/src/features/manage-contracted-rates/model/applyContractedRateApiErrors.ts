import { getFieldError, getValidationErrors } from "@sol/api-client";

import type {
  ContractedRateFormFieldErrors,
  ContractedRatePriceRowFieldErrors,
} from "./contractedRateFormValidation";
import type { ContractedRatePriceRowValidationInput } from "./contractedRateFormValidation";

export interface ContractedRateFormValidationState {
  setFieldErrors: (errors: ContractedRateFormFieldErrors | null) => void;
  dateRowCount: number;
  priceRows: ContractedRatePriceRowValidationInput[];
}

function parseIndexedSegment(key: string, segment: string): number | undefined {
  const pattern = new RegExp(`${segment}\\[(\\d+)\\]`, "i");
  const match = key.match(pattern);
  if (!match) {
    return undefined;
  }
  const index = Number(match[1]);
  return Number.isNaN(index) ? undefined : index;
}

function mergePriceRowErrors(
  target: Record<string, ContractedRatePriceRowFieldErrors>,
  rowKey: string,
  patch: ContractedRatePriceRowFieldErrors
) {
  target[rowKey] = { ...target[rowKey], ...patch };
}

/**
 * Maps catalog contracted-rate API validation to dialog field errors.
 * @returns true when at least one field-level message was applied.
 */
export function applyContractedRateApiErrors(
  error: unknown,
  state: ContractedRateFormValidationState
): boolean {
  const validation = getValidationErrors(error);
  if (!validation) {
    return false;
  }

  const next: ContractedRateFormFieldErrors = {
    dateRows: Array.from({ length: state.dateRowCount }, () => undefined),
    priceRows: {},
  };
  let applied = false;

  const checkedRows = state.priceRows.filter((row) => row.checked);
  const checkedByIndex = checkedRows;

  for (const [rawKey, messages] of Object.entries(validation.errors)) {
    const message = messages[0]?.trim();
    if (!message) {
      continue;
    }

    const key = rawKey.trim();
    const lower = key.toLowerCase();

    if (lower === "seasonname" || lower.endsWith(".seasonname")) {
      next.seasonName = message;
      applied = true;
      continue;
    }

    if (lower === "priority" || lower.endsWith(".priority")) {
      next.priority = message;
      applied = true;
      continue;
    }

    if (
      lower === "dates" ||
      lower.startsWith("dates[") ||
      lower.includes("traveldate")
    ) {
      const rowIndex = parseIndexedSegment(key, "Dates");
      if (rowIndex !== undefined && rowIndex < next.dateRows.length) {
        next.dateRows[rowIndex] = message;
      } else {
        next.dateRows = next.dateRows.map(() => message);
      }
      applied = true;
      continue;
    }

    if (lower === "pricerows" || lower.startsWith("pricerows[")) {
      const rowIndex = parseIndexedSegment(key, "PriceRows");
      const targetRow =
        rowIndex !== undefined ? checkedByIndex[rowIndex] : undefined;
      const rowKey = targetRow?.key;
      const patch: ContractedRatePriceRowFieldErrors = {};
      if (lower.includes("net")) {
        patch.net = message;
      } else if (lower.includes("rack")) {
        patch.rack = message;
      } else if (rowKey) {
        patch.net = message;
      }
      if (rowKey && (patch.net || patch.rack)) {
        mergePriceRowErrors(next.priceRows, rowKey, patch);
        applied = true;
      } else if (!rowKey) {
        next.banner = message;
        applied = true;
      }
      continue;
    }

    if (
      lower.includes("bookingwindow") ||
      lower === "bookingwindowfrom" ||
      lower === "bookingwindowto"
    ) {
      next.banner = message;
      applied = true;
      continue;
    }

    const fallback = getFieldError(validation.errors, key);
    if (fallback) {
      next.banner = fallback;
      applied = true;
    }
  }

  if (!applied && validation.message) {
    next.banner = validation.message;
    applied = true;
  }

  if (applied) {
    state.setFieldErrors(next);
  }

  return applied;
}
