import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@sol/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { RangeCalendarGrid } from "./RangeCalendarGrid";
import type { CalendarDay } from "./utils";
import {
  CALENDAR_MIN_YEAR,
  clampCalendarYear,
  clampRangePickerLeftView,
  getCalendarMaxYear,
  getCalendarYearOptions,
  getRightMonth,
  parseISODate,
  toISODateString,
} from "./utils";

export interface DateRangePickerProps {
  from?: string;
  to?: string;
  /** When set, the start date is pinned and cannot be changed by clicking. */
  lockedFrom?: string;
  onConfirm: (from: string, to: string) => void;
  onSelectionChange?: (from: string, to: string) => void;
  showConfirm?: boolean;
  variant?: "default" | "panel";
  title?: string;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  lockedFrom,
  onConfirm,
  onSelectionChange,
  showConfirm = true,
  variant = "default",
  title,
  className,
}: DateRangePickerProps) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const monthsFull = tCommon("calendar.monthsFull", {
    returnObjects: true,
  }) as string[];
  const monthsShort = tCommon("calendar.monthsShort", {
    returnObjects: true,
  }) as string[];
  const maxYear = useMemo(() => getCalendarMaxYear(), []);

  const effectiveFrom = lockedFrom ?? from;
  const initialFrom = effectiveFrom ? parseISODate(effectiveFrom) : null;
  const initialTo = to ? parseISODate(to) : null;
  const initialAnchor = initialFrom ?? initialTo ?? new Date();

  const [view, setView] = useState(() =>
    clampRangePickerLeftView(
      clampCalendarYear(initialAnchor.getFullYear(), maxYear),
      initialAnchor.getMonth(),
      maxYear
    )
  );
  const [pendingFrom, setPendingFrom] = useState<Date | null>(initialFrom);
  const [pendingTo, setPendingTo] = useState<Date | null>(initialTo);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Keep lockedFrom in sync (e.g. when start date changes while popover is open)
  const lockedFromRef = useRef(lockedFrom);
  lockedFromRef.current = lockedFrom;
  useEffect(() => {
    if (!lockedFrom) return;
    const locked = parseISODate(lockedFrom);
    if (!locked) return;
    setPendingFrom(locked);
    setView(
      clampRangePickerLeftView(
        clampCalendarYear(locked.getFullYear(), maxYear),
        locked.getMonth(),
        maxYear
      )
    );
  }, [lockedFrom, maxYear]);

  useEffect(() => {
    if (lockedFromRef.current) return;
    const nextFrom = from ? parseISODate(from) : null;
    const nextTo = to ? parseISODate(to) : null;
    const anchor = nextFrom ?? nextTo ?? new Date();

    setView(
      clampRangePickerLeftView(
        clampCalendarYear(anchor.getFullYear(), maxYear),
        anchor.getMonth(),
        maxYear
      )
    );
    setPendingFrom(nextFrom);
    setPendingTo(nextTo);
    setHoverDate(null);
  }, [from, maxYear, to]);

  const right = getRightMonth(view.year, view.month);
  const yearOptions = useMemo(() => getCalendarYearOptions(), []);

  const goToPrevMonth = useCallback(() => {
    setView(({ year, month }) => {
      if (month > 0) {
        return clampRangePickerLeftView(year, month - 1, maxYear);
      }

      if (year > CALENDAR_MIN_YEAR) {
        return clampRangePickerLeftView(year - 1, 11, maxYear);
      }

      return clampRangePickerLeftView(CALENDAR_MIN_YEAR, 0, maxYear);
    });
  }, [maxYear]);

  const goToNextMonth = useCallback(() => {
    setView(({ year, month }) => {
      if (month < 11) {
        return clampRangePickerLeftView(year, month + 1, maxYear);
      }

      if (year < maxYear) {
        return clampRangePickerLeftView(year + 1, 0, maxYear);
      }

      return clampRangePickerLeftView(year, month, maxYear);
    });
  }, [maxYear]);

  const handleDayClick = useCallback(
    (day: CalendarDay) => {
      if (lockedFromRef.current) {
        // Start is locked — clicking always sets the end date
        const fromDate = pendingFrom ?? parseISODate(lockedFromRef.current);
        if (!fromDate) return;
        setPendingTo(day.date);
        setHoverDate(null);
        onSelectionChange?.(
          toISODateString(fromDate),
          toISODateString(day.date)
        );
        return;
      }

      if (!pendingFrom || pendingTo !== null) {
        setPendingFrom(day.date);
        setPendingTo(null);
        setHoverDate(null);
        onSelectionChange?.(toISODateString(day.date), "");
        return;
      }

      if (day.date >= pendingFrom) {
        setPendingTo(day.date);
        setHoverDate(null);
        onSelectionChange?.(
          toISODateString(pendingFrom),
          toISODateString(day.date)
        );
        return;
      }

      setPendingFrom(day.date);
      setPendingTo(null);
      setHoverDate(null);
      onSelectionChange?.(toISODateString(day.date), "");
    },
    [onSelectionChange, pendingFrom, pendingTo]
  );

  const handleDayHover = useCallback(
    (day: CalendarDay | null) => {
      if (lockedFromRef.current) {
        // Always show hover range when from is locked
        setHoverDate(day?.date ?? null);
        return;
      }

      if (!pendingFrom || pendingTo !== null) {
        setHoverDate(null);
        return;
      }

      setHoverDate(day?.date ?? null);
    },
    [pendingFrom, pendingTo]
  );

  const handleConfirm = useCallback(() => {
    if (pendingFrom && pendingTo) {
      onConfirm(toISODateString(pendingFrom), toISODateString(pendingTo));
    }
  }, [onConfirm, pendingFrom, pendingTo]);

  const rightMonthLabel = `${monthsFull[right.month]} ${right.year}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        variant === "panel" &&
          "rounded-[6px] bg-white p-3 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      {variant === "panel" && title ? (
        <p className="text-base font-bold leading-6 text-text-primary">
          {title}
        </p>
      ) : null}

      {variant === "panel" ? (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-md"
            onClick={goToPrevMonth}
            aria-label={tCommon("aria.previousMonth")}
            className="size-9 border-border-tertiary bg-white text-text-primary hover:bg-background-primary"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <p className="min-w-0 flex-1 text-center text-sm font-semibold leading-6 text-text-primary">
            {`${monthsFull[view.month]} ${view.year}`}
          </p>
          <p className="min-w-0 flex-1 text-center text-sm font-semibold leading-6 text-text-primary">
            {rightMonthLabel}
          </p>

          <Button
            type="button"
            variant="outline"
            size="icon-md"
            onClick={goToNextMonth}
            aria-label={tCommon("aria.nextMonth")}
            className="size-9 border-border-tertiary bg-white text-text-primary hover:bg-background-primary"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-md"
            onClick={goToPrevMonth}
            aria-label={tCommon("aria.previousMonth")}
            className="size-9 border-border-tertiary bg-white text-text-primary hover:bg-background-primary"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Select
                value={String(view.month)}
                onValueChange={(nextMonth) =>
                  setView((previous) =>
                    clampRangePickerLeftView(
                      previous.year,
                      Number(nextMonth),
                      maxYear
                    )
                  )
                }
              >
                <SelectTrigger
                  size="default"
                  className="h-9 w-auto min-w-[90px] gap-2 border-border-tertiary bg-background-primary px-3 py-1.5 text-sm font-medium leading-6 text-text-primary shadow-none focus-visible:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {monthsShort.map((monthLabel, index) => (
                    <SelectItem key={monthLabel} value={String(index)}>
                      {monthLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(view.year)}
                onValueChange={(nextYear) =>
                  setView((previous) =>
                    clampRangePickerLeftView(
                      clampCalendarYear(Number(nextYear), maxYear),
                      previous.month,
                      maxYear
                    )
                  )
                }
              >
                <SelectTrigger
                  size="default"
                  className="h-9 w-auto min-w-[79px] gap-2 border-border-tertiary bg-background-primary px-3 py-1.5 text-sm font-medium leading-6 text-text-primary shadow-none focus-visible:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="whitespace-nowrap text-center text-sm font-semibold leading-6 text-text-primary">
              {rightMonthLabel}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-md"
            onClick={goToNextMonth}
            aria-label={tCommon("aria.nextMonth")}
            className="size-9 border-border-tertiary bg-white text-text-primary hover:bg-background-primary"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-1 gap-4">
        <RangeCalendarGrid
          year={view.year}
          month={view.month}
          pendingFrom={pendingFrom}
          pendingTo={pendingTo}
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
        <RangeCalendarGrid
          year={right.year}
          month={right.month}
          pendingFrom={pendingFrom}
          pendingTo={pendingTo}
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
      </div>

      {showConfirm ? (
        <Button
          type="button"
          variant={variant === "panel" ? "tertiary" : "outline"}
          size={variant === "panel" ? "md" : "sm"}
          disabled={!pendingFrom || !pendingTo}
          onClick={handleConfirm}
          className={cn(
            "self-start",
            variant === "default" &&
              "h-9 border-brand-red text-sm font-medium text-brand-red hover:bg-brand-red/5 hover:text-brand-red disabled:opacity-40"
          )}
        >
          {t("buttons.confirm")}
        </Button>
      ) : null}
    </div>
  );
}
