/** Shape needed for travel overlap detection (any contracted-rate row with nested travel dates). */
export type ContractedRateTravelOverlapInput = {
  /** Used to allow cross-row date overlap only when priorities differ (finite and unequal). */
  priority?: number | string;
  contractedRateDates: {
    travelDates: { travelDateFrom: string; travelDateTo: string }[];
  }[];
};

/** Inclusive range overlap for ISO date strings (lexicographic order matches chronological for YYYY-MM-DD). */
function travelRangesOverlapInclusive(
  fromA: string,
  toA: string,
  fromB: string,
  toB: string
): boolean {
  return fromA <= toB && fromB <= toA;
}

type TaggedInterval = {
  crIdx: number;
  dateIndex: number;
  travelIndex: number;
  from: string;
  to: string;
};

function completeIntervalsAcrossContractedRates(
  rates: ContractedRateTravelOverlapInput[]
): TaggedInterval[] {
  const out: TaggedInterval[] = [];
  rates.forEach((cr, crIdx) => {
    cr.contractedRateDates.forEach((date, dateIndex) => {
      date.travelDates.forEach((td, travelIndex) => {
        const from = td.travelDateFrom?.trim() ?? "";
        const to = td.travelDateTo?.trim() ?? "";
        if (from && to && from < to) {
          out.push({ crIdx, dateIndex, travelIndex, from, to });
        }
      });
    });
  });
  return out;
}

function formatMergedOverlapKey(i: TaggedInterval): string {
  return `${i.crIdx}:${i.dateIndex}:${i.travelIndex}`;
}

/**
 * `${crIdx}:${dateIndex}:${travelIndex}` for every travel row that overlaps another row
 * (within the same contracted rate or across different contracted rates).
 */
export function getOverlappingTravelKeysAcrossContractedRates(
  rates: ContractedRateTravelOverlapInput[]
): Set<string> {
  const intervals = completeIntervalsAcrossContractedRates(rates);
  const keys = new Set<string>();
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i];
      const b = intervals[j];
      const sameCr = a.crIdx === b.crIdx;
      const pa = Number(rates[a.crIdx]?.priority);
      const pb = Number(rates[b.crIdx]?.priority);
      const crossRowAllowed =
        !sameCr && Number.isFinite(pa) && Number.isFinite(pb) && pa !== pb;
      if (crossRowAllowed) continue;
      if (travelRangesOverlapInclusive(a.from, a.to, b.from, b.to)) {
        keys.add(formatMergedOverlapKey(a));
        keys.add(formatMergedOverlapKey(b));
      }
    }
  }
  return keys;
}

/**
 * `${dateIndex}:${travelIndex}` for every travel row that overlaps another row
 * within the same contracted rate (all `contractedRateDates` buckets combined).
 * Implemented via {@link getOverlappingTravelKeysAcrossContractedRates}([cr]).
 */
export function getOverlappingContractedRateTravelKeys(
  cr: ContractedRateTravelOverlapInput
): Set<string> {
  const full = getOverlappingTravelKeysAcrossContractedRates([cr]);
  const out = new Set<string>();
  for (const k of full) {
    const parts = k.split(":");
    if (parts.length === 3 && parts[0] === "0") {
      out.add(`${parts[1]}:${parts[2]}`);
    }
  }
  return out;
}
