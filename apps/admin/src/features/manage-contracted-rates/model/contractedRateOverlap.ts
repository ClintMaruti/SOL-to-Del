import type { ContractedRateDateItemRequest } from "@/entities/contracted-rate";

export type ContractedRateOverlapRow = {
  id?: string;
  contractId: string;
  serviceOptionId: string;
  rateId: string;
  priority: number;
  dates: {
    travelDateFrom: string;
    travelDateTo: string;
    bookingWindowFrom?: string | null;
    bookingWindowTo?: string | null;
    weekdays: string[];
  }[];
};

function travelRangesOverlap(
  fromA: string,
  toA: string,
  fromB: string,
  toB: string
): boolean {
  return fromA <= toB && fromB <= toA;
}

function weekdaysOverlap(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return true;
  const setB = new Set(b);
  return a.some((d) => setB.has(d));
}

function bookingWindowsOverlap(
  a: { bookingWindowFrom?: string | null; bookingWindowTo?: string | null },
  b: { bookingWindowFrom?: string | null; bookingWindowTo?: string | null }
): boolean {
  const fromA = a.bookingWindowFrom?.trim() ?? "";
  const toA = a.bookingWindowTo?.trim() ?? "";
  const fromB = b.bookingWindowFrom?.trim() ?? "";
  const toB = b.bookingWindowTo?.trim() ?? "";
  if (!fromA && !toA && !fromB && !toB) return true;
  if (!fromA || !toA || !fromB || !toB) return true;
  return travelRangesOverlap(fromA, toA, fromB, toB);
}

function rowsConflict(
  left: ContractedRateOverlapRow,
  right: ContractedRateOverlapRow,
  excludeId?: string
): boolean {
  if (excludeId && (left.id === excludeId || right.id === excludeId)) {
    if (left.id === excludeId || right.id === excludeId) {
      if (left.id === right.id) return false;
    }
  }
  if (left.id && right.id && left.id === right.id) return false;
  if (left.contractId !== right.contractId) return false;
  if (left.serviceOptionId !== right.serviceOptionId) return false;
  if (left.rateId !== right.rateId) return false;
  if (left.priority !== right.priority) return false;

  for (const dA of left.dates) {
    for (const dB of right.dates) {
      if (
        travelRangesOverlap(
          dA.travelDateFrom,
          dA.travelDateTo,
          dB.travelDateFrom,
          dB.travelDateTo
        ) &&
        bookingWindowsOverlap(dA, dB) &&
        weekdaysOverlap(dA.weekdays ?? [], dB.weekdays ?? [])
      ) {
        return true;
      }
    }
  }
  return false;
}

export function hasContractedRateOverlap(
  candidate: ContractedRateOverlapRow,
  existing: ContractedRateOverlapRow[],
  excludeId?: string
): boolean {
  return existing.some((row) => {
    if (excludeId && row.id === excludeId) return false;
    return rowsConflict(candidate, row, excludeId);
  });
}

export function validateTravelDateRanges(
  dates: ContractedRateDateItemRequest[]
): string | null {
  for (const d of dates) {
    if (d.travelDateFrom > d.travelDateTo) {
      return "ContractedRate_InvalidTravelDateRange";
    }
    if (
      d.bookingWindowFrom &&
      d.bookingWindowTo &&
      d.bookingWindowTo > d.travelDateTo
    ) {
      return "ContractedRate_BookingWindowExceedsTravelDate";
    }
  }
  return null;
}
