import { useCallback, useEffect, useRef, useState } from "react";

import {
  FIRST_LINE_CONTENT_GAP_PX,
  getVisibleFilterChipCount,
} from "./marginRulesList.utils";
import type { MarginRulesFilterChip } from "./types";

export function useVisibleMarginRulesFilterChips(
  appliedFilterChips: MarginRulesFilterChip[]
) {
  const [visibleChipCount, setVisibleChipCount] = useState(
    appliedFilterChips.length
  );
  const firstLineRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLDivElement | null>(null);
  const dotMeasureRef = useRef<HTMLDivElement | null>(null);
  const chipMeasureRefs = useRef(
    new Map<MarginRulesFilterChip["key"], HTMLDivElement | null>()
  );

  const setChipMeasureRef = useCallback(
    (key: MarginRulesFilterChip["key"]) => (node: HTMLDivElement | null) => {
      if (node) {
        chipMeasureRefs.current.set(key, node);
        return;
      }

      chipMeasureRefs.current.delete(key);
    },
    []
  );

  const measureVisibleFilterChips = useCallback(() => {
    if (appliedFilterChips.length === 0) {
      setVisibleChipCount(0);
      return;
    }

    const firstLineWidth = firstLineRef.current?.clientWidth ?? 0;
    const countWidth = countRef.current?.offsetWidth ?? 0;
    const dotWidth = dotMeasureRef.current?.offsetWidth ?? 0;

    if (firstLineWidth === 0 || countWidth === 0) {
      setVisibleChipCount(appliedFilterChips.length);
      return;
    }

    const chipWidths = appliedFilterChips.map(
      (chip) => chipMeasureRefs.current.get(chip.key)?.offsetWidth ?? 0
    );

    if (chipWidths.some((width) => width === 0)) {
      setVisibleChipCount(appliedFilterChips.length);
      return;
    }

    const availableChipWidth = Math.max(
      0,
      firstLineWidth - countWidth - FIRST_LINE_CONTENT_GAP_PX
    );

    setVisibleChipCount(
      getVisibleFilterChipCount(chipWidths, availableChipWidth, dotWidth)
    );
  }, [appliedFilterChips]);

  useEffect(() => {
    measureVisibleFilterChips();
  }, [measureVisibleFilterChips]);

  useEffect(() => {
    const firstLineElement = firstLineRef.current;

    if (!firstLineElement || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      measureVisibleFilterChips();
    });

    resizeObserver.observe(firstLineElement);

    if (countRef.current) {
      resizeObserver.observe(countRef.current);
    }

    if (dotMeasureRef.current) {
      resizeObserver.observe(dotMeasureRef.current);
    }

    chipMeasureRefs.current.forEach((chipElement) => {
      if (chipElement) {
        resizeObserver.observe(chipElement);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [appliedFilterChips, measureVisibleFilterChips]);

  const normalizedVisibleChipCount = Math.min(
    visibleChipCount,
    appliedFilterChips.length
  );

  return {
    firstLineRef,
    countRef,
    dotMeasureRef,
    setChipMeasureRef,
    visibleChips: appliedFilterChips.slice(0, normalizedVisibleChipCount),
    hiddenChips: appliedFilterChips.slice(normalizedVisibleChipCount),
  };
}
