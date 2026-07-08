import { useCallback } from "react";

import {
  selectDateHasOverlap,
  useValidityDatesStore,
} from "./validity-dates-store";
import type { DateEntry } from "./validity-dates-store";

interface UseValidityDateRowParams {
  dateId: string;
  from: string;
  to: string;
  eligibilityId: string;
  serviceId: string;
  saveAttempted?: boolean;
  onUpdate: (id: string, updates: { from?: string; to?: string }) => void;
}

export function useValidityDateRow({
  dateId,
  from,
  to,
  eligibilityId,
  serviceId,
  saveAttempted,
  onUpdate,
}: UseValidityDateRowParams) {
  const setDate = useValidityDatesStore((s) => s.setDate);
  const hasOverlap = useValidityDatesStore(selectDateHasOverlap(dateId));

  const hasInvertedRange = !!(from && to && from > to);
  const isIncomplete = !from || !to;
  const hasError =
    hasOverlap || hasInvertedRange || (saveAttempted && isIncomplete);

  const handleFromChange = useCallback(
    (value: string) => {
      const entry: DateEntry = {
        from: value,
        to,
        eligibilityId,
        serviceId,
      };
      setDate(dateId, entry);
      onUpdate(dateId, { from: value });
    },
    [dateId, to, eligibilityId, serviceId, setDate, onUpdate]
  );

  const handleToChange = useCallback(
    (value: string) => {
      const entry: DateEntry = {
        from,
        to: value,
        eligibilityId,
        serviceId,
      };
      setDate(dateId, entry);
      onUpdate(dateId, { to: value });
    },
    [dateId, from, eligibilityId, serviceId, setDate, onUpdate]
  );

  return {
    handleFromChange,
    handleToChange,
    hasError,
  };
}
