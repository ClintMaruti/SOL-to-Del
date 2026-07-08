import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@sol/ui";
import {
  Calendar,
  CalendarDaysIcon,
  CircleXIcon,
  PlusIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type TravelDate,
  weekdaysForUiDisplay,
} from "@/entities/service-option-rate";
import { DateRangePicker } from "@/shared/ui";

import { formatDateRange } from "../lib/formatDate";

const WEEKDAYS = [
  { value: "MON", labelKey: "weekdays.mon" },
  { value: "TUE", labelKey: "weekdays.tue" },
  { value: "WED", labelKey: "weekdays.wed" },
  { value: "THU", labelKey: "weekdays.thu" },
  { value: "FRI", labelKey: "weekdays.fri" },
  { value: "SAT", labelKey: "weekdays.sat" },
  { value: "SUN", labelKey: "weekdays.sun" },
] as const;

function parseWeekdays(weekdays?: string): string[] {
  if (!weekdays) return [];
  return weekdays
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

interface TravelDateItemProps {
  travelDate: TravelDate;
  travelDateIndex: number;
  hasError?: boolean;
  onAdd: () => void;
  onDatesChange: (from: string, to: string) => void;
  onWeekdaysChange: (weekdays: string) => void;
}

export function TravelDateItem({
  travelDate,
  hasError,
  onAdd,
  onDatesChange,
  onWeekdaysChange,
}: TravelDateItemProps) {
  const { t } = useTranslation("admin");

  const [travelOpen, setTravelOpen] = useState(false);

  // Weekday popover
  const [weekdayPopoverOpen, setWeekdayPopoverOpen] = useState(false);
  const [draftDays, setDraftDays] = useState<string[]>([]);

  const travelRange = formatDateRange(
    travelDate.travelDateFrom,
    travelDate.travelDateTo
  );

  const displayDays = weekdaysForUiDisplay(travelDate.weekdays);
  const hasSpecificWeekdays = displayDays.length > 0;

  function handleWeekdayPopoverOpen(open: boolean) {
    if (open) setDraftDays(parseWeekdays(travelDate.weekdays));
    setWeekdayPopoverOpen(open);
  }

  function handleWeekdaySave() {
    onWeekdaysChange(draftDays.join(","));
    setWeekdayPopoverOpen(false);
  }

  return (
    <div className="flex items-center justify-between text-sm gap-2">
      <div
        className={cn(
          "flex flex-1 min-w-0",
          hasError && "border border-destructive bg-error-bg"
        )}
      >
        <Popover open={travelOpen} onOpenChange={setTravelOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-invalid={hasError}
              className={cn(
                "flex h-9 flex-1 min-w-0 justify-start gap-2 rounded-none px-2 text-sm font-medium text-foreground",
                hasError &&
                  "hover:bg-inherit border-0! focus-visible:ring-0! aria-invalid:border-0! aria-invalid:shadow-none!"
              )}
            >
              <Calendar
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground",
                  hasError && "text-red-600"
                )}
              />
              <span className="truncate">
                {travelRange ?? t("labels.selectDates")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <DateRangePicker
              from={travelDate.travelDateFrom || undefined}
              to={travelDate.travelDateTo || undefined}
              onConfirm={(from, to) => {
                onDatesChange(from, to);
                setTravelOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Remove this travel date */}
        {hasSpecificWeekdays && (
          <Button
            size="icon-sm"
            variant="default"
            className="bg-transparent hover:bg-transparent text-brand-red "
            aria-label={t("aria.removeDate")}
            onClick={() => {
              onWeekdaysChange?.("");
              setDraftDays([]);
            }}
          >
            <CircleXIcon className="size-5" />
          </Button>
        )}

        {hasSpecificWeekdays && (
          <span className="text-sm font-semibold leading-6 text-primary uppercase">
            {displayDays.join(", ")}
          </span>
        )}

        {/* Weekday selector */}
        <Popover
          open={weekdayPopoverOpen}
          onOpenChange={handleWeekdayPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              size="icon-sm"
              variant="default"
              className={cn(
                "bg-transparent hover:bg-transparent",
                hasSpecificWeekdays ? "text-brand-red" : "text-muted-foreground"
              )}
              aria-label={t("aria.selectWeekdays")}
            >
              <CalendarDaysIcon className="size-5 text-brand-red" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 space-y-3" align="end">
            <p className="text-sm font-semibold text-primary leading-6">
              {t("labels.selectWeekdays")}
            </p>
            <ToggleGroup
              type="multiple"
              value={draftDays}
              onValueChange={setDraftDays}
              variant="outline"
              className="flex gap-1"
            >
              {WEEKDAYS.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value}
                  className="h-8 w-10 text-xs data-[state=on]:bg-brand-red data-[state=on]:text-primary-foreground rounded-md! border! py-1.5 px-2"
                >
                  {day.value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={handleWeekdaySave}>
              {t("buttons.save")}
            </Button>
          </PopoverContent>
        </Popover>

        {/* Add travel date below */}
        <Button
          size="icon-sm"
          variant="default"
          className="bg-transparent text-brand-red hover:bg-transparent"
          aria-label={t("aria.addDate")}
          onClick={onAdd}
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
