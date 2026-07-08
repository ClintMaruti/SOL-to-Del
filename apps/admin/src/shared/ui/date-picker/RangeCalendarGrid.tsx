import { cn } from "@sol/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { CalendarDay } from "./utils";
import { getCalendarDays, isSameDay } from "./utils";

interface RangeCalendarGridProps {
  year: number;
  month: number;
  pendingFrom: Date | null;
  pendingTo: Date | null;
  hoverDate: Date | null;
  onDayClick: (day: CalendarDay) => void;
  onDayHover: (day: CalendarDay | null) => void;
}

export function RangeCalendarGrid({
  year,
  month,
  pendingFrom,
  pendingTo,
  hoverDate,
  onDayClick,
  onDayHover,
}: RangeCalendarGridProps) {
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

  const effectiveTo = pendingTo ?? hoverDate;

  return (
    <div className="flex flex-1 flex-col gap-px">
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
            const isStart = pendingFrom
              ? isSameDay(day.date, pendingFrom)
              : false;
            const isEnd = effectiveTo
              ? isSameDay(day.date, effectiveTo)
              : false;
            const isInRange =
              pendingFrom &&
              effectiveTo &&
              day.date > pendingFrom &&
              day.date < effectiveTo;
            const isSelected = isStart || isEnd;

            return (
              <button
                key={day.date.toISOString()}
                type="button"
                onClick={() => onDayClick(day)}
                onMouseEnter={() => onDayHover(day)}
                onMouseLeave={() => onDayHover(null)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-[4px] bg-background-primary text-sm font-medium leading-6 text-text-primary transition-colors",
                  !day.isCurrentMonth && "opacity-50 hover:opacity-70",
                  day.isCurrentMonth && !isSelected && "hover:bg-brand-red/10",
                  isInRange && !isSelected && "bg-background-secondary",
                  isSelected && "bg-brand-red text-white",
                  day.isToday &&
                    !isSelected &&
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
