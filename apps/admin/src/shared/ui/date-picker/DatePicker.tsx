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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SingleMonthCalendarGrid } from "./SingleMonthCalendarGrid";
import {
  CALENDAR_MIN_YEAR,
  clampCalendarYear,
  getCalendarMaxYear,
  getCalendarYearOptions,
  getRightMonth,
} from "./utils";

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  className?: string;
  isDateDisabled?: (date: Date) => boolean;
}

export function DatePicker({
  value,
  onChange,
  className,
  isDateDisabled,
}: DatePickerProps) {
  const { t } = useTranslation("common");
  const monthsShort = t("calendar.monthsShort", {
    returnObjects: true,
  }) as string[];
  const maxYear = useMemo(() => getCalendarMaxYear(), []);

  const initialDate = value ?? new Date();
  const [view, setView] = useState(() => ({
    year: clampCalendarYear(initialDate.getFullYear(), maxYear),
    month: initialDate.getMonth(),
  }));

  useEffect(() => {
    if (!value) {
      return;
    }

    setView({
      year: clampCalendarYear(value.getFullYear(), maxYear),
      month: value.getMonth(),
    });
  }, [maxYear, value]);

  const yearOptions = useMemo(() => getCalendarYearOptions(), []);

  const goToPrevMonth = useCallback(() => {
    setView(({ year, month }) => {
      if (month > 0) {
        return { year, month: month - 1 };
      }

      if (year > CALENDAR_MIN_YEAR) {
        return { year: year - 1, month: 11 };
      }

      return { year: CALENDAR_MIN_YEAR, month: 0 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setView(({ year, month }) => {
      if (month < 11) {
        return { year, month: month + 1 };
      }

      if (year < maxYear) {
        return { year: year + 1, month: 0 };
      }

      return { year, month: 11 };
    });
  }, [maxYear]);

  const right = getRightMonth(view.year, view.month);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-md"
          onClick={goToPrevMonth}
          aria-label={t("aria.previousMonth")}
          className="size-9 border-border-tertiary bg-white text-text-primary hover:bg-background-primary"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex flex-1 items-center justify-around gap-2">
          <div className="flex items-center gap-2">
            <Select
              value={String(view.month)}
              onValueChange={(nextMonth) =>
                setView((previous) => ({
                  ...previous,
                  month: Number(nextMonth),
                }))
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
                setView((previous) => ({
                  ...previous,
                  year: clampCalendarYear(Number(nextYear), maxYear),
                }))
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

          <p className="text-sm font-semibold leading-6 text-text-primary">
            {monthsShort[right.month]} {right.year}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-md"
          onClick={goToNextMonth}
          aria-label={t("aria.nextMonth")}
          className="size-9 border-border-tertiary bg-white text-text-primary hover:bg-background-primary"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex gap-4">
        <SingleMonthCalendarGrid
          year={view.year}
          month={view.month}
          selectedDate={value ?? null}
          onDayClick={(date) => onChange?.(date)}
          isDateDisabled={isDateDisabled}
        />
        <div className="w-px bg-border-tertiary" />
        <SingleMonthCalendarGrid
          year={right.year}
          month={right.month}
          selectedDate={value ?? null}
          onDayClick={(date) => onChange?.(date)}
          isDateDisabled={isDateDisabled}
        />
      </div>
    </div>
  );
}
