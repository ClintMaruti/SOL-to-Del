import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@sol/ui";
import {
  Calendar,
  CalendarDaysIcon,
  CircleX,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ContractedRateDateItemRequest } from "@/entities/contracted-rate";
import { formatDate } from "@/shared/lib";
import { DateRangePicker } from "@/shared/ui";

const WEEKDAYS = [
  { value: "MON", labelKey: "weekdays.mon" },
  { value: "TUE", labelKey: "weekdays.tue" },
  { value: "WED", labelKey: "weekdays.wed" },
  { value: "THU", labelKey: "weekdays.thu" },
  { value: "FRI", labelKey: "weekdays.fri" },
  { value: "SAT", labelKey: "weekdays.sat" },
  { value: "SUN", labelKey: "weekdays.sun" },
] as const;

function formatTravelRange(from: string, to: string): string | null {
  if (!from && !to) return null;
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  return formatDate(to);
}

function formatWeekdaysLabel(weekdays: string[]): string {
  if (!weekdays.length) return "--";
  return weekdays.join(", ");
}

interface ContractedRateTravelDatesTableProps {
  dates: ContractedRateDateItemRequest[];
  onDatesChange: (dates: ContractedRateDateItemRequest[]) => void;
  onAddRow: () => void;
  /** Per-row validation message; row highlights when message is set */
  dateRowErrors?: Array<string | undefined>;
}

export function ContractedRateTravelDatesTable({
  dates,
  onDatesChange,
  onAddRow,
  dateRowErrors,
}: ContractedRateTravelDatesTableProps) {
  const { t } = useTranslation(["admin", "common"]);

  const updateRow = (
    index: number,
    patch: Partial<ContractedRateDateItemRequest>
  ) => {
    onDatesChange(dates.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const removeRow = (index: number) => {
    if (dates.length <= 1) return;
    onDatesChange(dates.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {t("sections.travelDates")}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-brand-red text-brand-red"
          onClick={onAddRow}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("buttons.add")}
        </Button>
      </div>
      <div className="w-full overflow-hidden rounded-[6px] border border-border-tertiary">
        <div className="grid grid-cols-[1fr_1fr_115px] border-b border-border-tertiary bg-gray-100">
          <div className="px-4 py-2 text-sm font-semibold text-foreground">
            {t("labels.travelDates")}
          </div>
          <div className="border-l border-border-tertiary px-4 py-2 text-sm font-semibold text-foreground">
            {t("serviceRates.daysOfWeekColumn")}
          </div>
          <div className="border-l border-border-tertiary px-3 py-2 text-right text-sm font-semibold text-foreground">
            {t("tableHeaders.actions")}
          </div>
        </div>
        {dates.map((row, index) => (
          <TravelDateRow
            key={index}
            row={row}
            canRemove={dates.length > 1}
            errorMessage={dateRowErrors?.[index]}
            onChange={(patch) => updateRow(index, patch)}
            onRemove={() => removeRow(index)}
          />
        ))}
      </div>
    </div>
  );
}

function TravelDateRow({
  row,
  canRemove,
  errorMessage,
  onChange,
  onRemove,
}: {
  row: ContractedRateDateItemRequest;
  canRemove: boolean;
  errorMessage?: string;
  onChange: (patch: Partial<ContractedRateDateItemRequest>) => void;
  onRemove: () => void;
}) {
  const hasError = Boolean(errorMessage);
  const { t } = useTranslation(["admin", "common"]);
  const [travelOpen, setTravelOpen] = useState(false);
  const [weekdayOpen, setWeekdayOpen] = useState(false);
  const [draftWeekdays, setDraftWeekdays] = useState<string[]>(
    row.weekdays ?? []
  );

  const travelRange = formatTravelRange(row.travelDateFrom, row.travelDateTo);
  const weekdayLabel = formatWeekdaysLabel(row.weekdays ?? []);
  const hasWeekdays = (row.weekdays ?? []).length > 0;

  return (
    <div className="border-b border-border-tertiary last:border-b-0">
      <div
        className={`grid grid-cols-[1fr_1fr_115px]${hasError ? " bg-red-50" : " bg-white"}`}
      >
        <div
          className={`flex min-h-9 items-center${hasError ? " border border-brand-red" : ""}`}
        >
          <Popover open={travelOpen} onOpenChange={setTravelOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className={`h-9 min-h-9 w-full justify-start gap-2 rounded-none px-4 text-sm font-medium text-foreground hover:bg-transparent${hasError ? " text-brand-red" : ""}`}
              >
                <Calendar
                  className={`h-5 w-5 shrink-0 ${hasError ? "text-brand-red" : "text-muted-foreground"}`}
                />
                <span className="truncate">
                  {travelRange ?? t("labels.selectDates")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <DateRangePicker
                from={row.travelDateFrom || undefined}
                to={row.travelDateTo || undefined}
                onConfirm={(from, to) => {
                  onChange({ travelDateFrom: from, travelDateTo: to });
                  setTravelOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex min-h-9 items-center border-l border-border-tertiary">
          <span className="min-w-0 flex-1 truncate px-4 text-sm font-medium uppercase text-foreground">
            {weekdayLabel}
          </span>
          <Popover
            open={weekdayOpen}
            onOpenChange={(open) => {
              if (open) setDraftWeekdays(row.weekdays ?? []);
              setWeekdayOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-none text-brand-red"
                aria-label={t("labels.selectWeekdays")}
              >
                <CalendarDaysIcon className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto space-y-3 p-3" align="end">
              <p className="text-sm font-semibold text-foreground">
                {t("labels.selectWeekdays")}
              </p>
              <ToggleGroup
                type="multiple"
                value={draftWeekdays}
                onValueChange={setDraftWeekdays}
                className="flex flex-wrap gap-1"
              >
                {WEEKDAYS.map((day) => (
                  <ToggleGroupItem
                    key={day.value}
                    value={day.value}
                    className="h-8 w-10 rounded-[4px] border border-border-tertiary text-xs data-[state=on]:bg-brand-red data-[state=on]:text-white"
                  >
                    {day.value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange({ weekdays: draftWeekdays });
                  setWeekdayOpen(false);
                }}
              >
                {t("buttons.save")}
              </Button>
            </PopoverContent>
          </Popover>
          {hasWeekdays ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-none text-brand-red"
              aria-label={t("buttons.clear")}
              onClick={() => onChange({ weekdays: [] })}
            >
              <CircleX className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        <div className="flex min-h-9 items-center justify-end border-l border-border-tertiary pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none"
            disabled={!canRemove}
            onClick={onRemove}
            aria-label={t("common:buttons.delete")}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      {errorMessage ? (
        <p className="border-t border-brand-red/20 bg-red-50 px-4 py-1.5 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
