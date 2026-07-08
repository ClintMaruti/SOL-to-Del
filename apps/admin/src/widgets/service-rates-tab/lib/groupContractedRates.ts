import type {
  ContractedRate,
  ContractedRateDate,
  ContractedRateSeasonGroup,
} from "@/entities/contracted-rate";

export type { ContractedRateSeasonGroup };

function datesSignature(dates: ContractedRateDate[]): string {
  return JSON.stringify(
    [...dates]
      .map((d) => ({
        travelDateFrom: d.travelDateFrom,
        travelDateTo: d.travelDateTo,
        bookingWindowFrom: d.bookingWindowFrom ?? null,
        bookingWindowTo: d.bookingWindowTo ?? null,
        weekdays: [...(d.weekdays ?? [])].sort(),
      }))
      .sort((a, b) =>
        `${a.travelDateFrom}-${a.travelDateTo}`.localeCompare(
          `${b.travelDateFrom}-${b.travelDateTo}`
        )
      )
  );
}

export function groupContractedRates(
  rows: ContractedRate[]
): ContractedRateSeasonGroup[] {
  const map = new Map<string, ContractedRateSeasonGroup>();

  for (const row of rows) {
    const sig = datesSignature(row.dates);
    const key = `${row.seasonName}::${row.priority}::${sig}`;
    const existing = map.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      map.set(key, {
        key,
        seasonName: row.seasonName,
        priority: row.priority,
        dates: row.dates,
        rows: [row],
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.seasonName.localeCompare(b.seasonName);
  });
}
