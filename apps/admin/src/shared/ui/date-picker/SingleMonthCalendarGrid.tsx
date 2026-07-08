import { cn } from "@sol/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { CalendarDay } from "./utils";
import { getCalendarDays, isSameDay } from "./utils";

interface SingleMonthCalendarGridProps {
  year: number;
  month: number;
  selectedDate: Date | null;
  onDayClick: (date: Date) => void;
  isDateDisabled?: (date: Date) => boolean;
}

export function SingleMonthCalendarGrid({
  year,
  month,
  selectedDate,
  onDayClick,
  isDateDisabled,
}: SingleMonthCalendarGridProps) {
  const { t } = useTranslation("common");
  const weekdayLabels = t("calendar.weekdaysShort", {
    returnObjects: true,
  }) as string[];

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);
  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      result.push(days.slice(index, index + 7));
    }
    return result;
  }, [days]);

  return (
    <div className="flex flex-col gap-px">
      <div className="grid grid-cols-7 gap-px">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="flex size-10 items-center justify-center text-xs font-medium leading-5 text-text-tertiary"
          >
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-px">
          {week.map((day) => {
            const isSelected = selectedDate
              ? isSameDay(day.date, selectedDate)
              : false;
            const isDisabled = isDateDisabled?.(day.date) ?? false;

            return (
              <button
                key={day.date.toISOString()}
                type="button"
                onClick={() => {
                  if (!isDisabled) {
                    onDayClick(day.date);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  "flex size-10 items-center justify-center rounded-[4px] bg-background-primary text-sm font-medium leading-6 text-text-primary transition-colors",
                  isDisabled &&
                    "cursor-not-allowed text-text-tertiary opacity-50 hover:bg-background-primary hover:opacity-50",
                  !day.isCurrentMonth &&
                    !isDisabled &&
                    "opacity-50 hover:opacity-70",
                  day.isCurrentMonth &&
                    !isSelected &&
                    !isDisabled &&
                    "hover:bg-brand-red/10",
                  isSelected && "bg-brand-red text-white",
                  day.isToday &&
                    !isSelected &&
                    !isDisabled &&
                    "ring-1 ring-inset ring-brand-red/40"
                )}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
