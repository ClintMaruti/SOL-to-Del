import { create } from "zustand";

export interface DateEntry {
  from: string;
  to: string;
  eligibilityId: string;
  serviceId: string;
}

interface ValidityDatesStore {
  dates: Record<string, DateEntry>;
  setDate: (id: string, entry: DateEntry) => void;
  removeDate: (id: string) => void;
  bulkSetDates: (entries: Record<string, DateEntry>) => void;
  bulkReplaceDates: (entries: Record<string, DateEntry>) => void;
  replaceForService: (
    serviceId: string,
    entries: Record<string, DateEntry>
  ) => void;
  removeDatesByEligibilityId: (eligibilityId: string) => void;
}

function hasOverlapInStore(
  dates: Record<string, DateEntry>,
  dateId: string
): boolean {
  const mine = dates[dateId];
  if (!mine?.from || !mine?.to) return false;
  return Object.entries(dates).some(
    ([id, other]) =>
      id !== dateId &&
      other.serviceId === mine.serviceId &&
      other.from &&
      other.to &&
      mine.from <= other.to &&
      other.from <= mine.to
  );
}

function datesEqual(
  left: Record<string, DateEntry>,
  right: Record<string, DateEntry>
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key) => {
    const leftEntry = left[key];
    const rightEntry = right[key];

    return (
      rightEntry !== undefined &&
      leftEntry.from === rightEntry.from &&
      leftEntry.to === rightEntry.to &&
      leftEntry.eligibilityId === rightEntry.eligibilityId &&
      leftEntry.serviceId === rightEntry.serviceId
    );
  });
}

export function selectDateHasOverlap(dateId: string) {
  return (state: ValidityDatesStore) => hasOverlapInStore(state.dates, dateId);
}

export function selectEligibilityHasOverlap(
  eligibilityId: string,
  serviceId: string
) {
  return (state: ValidityDatesStore) =>
    Object.entries(state.dates).some(([id, entry]) => {
      if (
        entry.eligibilityId !== eligibilityId ||
        entry.serviceId !== serviceId
      )
        return false;
      if (!entry.from || !entry.to) return false;
      return hasOverlapInStore(state.dates, id);
    });
}

export const useValidityDatesStore = create<ValidityDatesStore>((set) => ({
  dates: {},

  setDate: (id, entry) =>
    set((state) => ({
      dates: { ...state.dates, [id]: entry },
    })),

  removeDate: (id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = state.dates;
      return { dates: rest };
    }),

  bulkSetDates: (entries) =>
    set((state) => ({
      dates: { ...state.dates, ...entries },
    })),

  bulkReplaceDates: (entries) =>
    set(() => ({
      dates: entries,
    })),

  replaceForService: (serviceId, entries) =>
    set((state) => {
      const kept = Object.fromEntries(
        Object.entries(state.dates).filter(([, e]) => e.serviceId !== serviceId)
      );
      const dates = { ...kept, ...entries };

      if (datesEqual(state.dates, dates)) {
        return state;
      }

      return { dates };
    }),

  removeDatesByEligibilityId: (eligibilityId) =>
    set((state) => ({
      dates: Object.fromEntries(
        Object.entries(state.dates).filter(
          ([, entry]) => entry.eligibilityId !== eligibilityId
        )
      ),
    })),
}));
