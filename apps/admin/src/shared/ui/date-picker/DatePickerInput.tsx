import { CalendarIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger, cn } from "@sol/ui";

import { DatePicker } from "./DatePicker";
import { DateRangePicker } from "./DateRangePicker";
import { formatDateDisplay, parseISODate, toISODateString } from "./utils";

export interface DatePickerInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  iconPosition?: "start" | "end";
  hasError?: boolean;
  /** When provided, the popover shows a 2-month range picker with this date pinned as the start. */
  rangeStart?: string;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder,
  className,
  id,
  disabled,
  iconPosition = "start",
  hasError,
  rangeStart,
}: DatePickerInputProps) {
  const { t } = useTranslation("common");
  const monthsFull = t("calendar.monthsFull", {
    returnObjects: true,
  }) as string[];
  const [open, setOpen] = useState(false);
  const effectivePlaceholder = placeholder ?? t("placeholders.selectDate");
  const dateValue = useMemo(
    () => (value ? parseISODate(value) : null),
    [value]
  );

  const handleSelect = useCallback(
    (date: Date) => {
      onChange?.(toISODateString(date));
      setOpen(false);
    },
    [onChange]
  );

  const handleRangeSelectionChange = useCallback(
    (_from: string, to: string) => {
      if (to) {
        onChange?.(to);
        setOpen(false);
      }
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          id={id}
          className={cn(
            "border-input flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-none transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            dateValue ? "text-text-primary" : "text-muted-foreground",
            hasError && "border-destructive ring-destructive/20 ring-1",
            className
          )}
        >
          {iconPosition === "start" ? (
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : null}

          <span className="truncate">
            {dateValue
              ? formatDateDisplay(dateValue, monthsFull)
              : effectivePlaceholder}
          </span>

          {iconPosition === "end" ? (
            <CalendarIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto border-none bg-white p-3 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]"
      >
        {rangeStart ? (
          <DateRangePicker
            lockedFrom={rangeStart}
            to={value}
            onConfirm={() => {}}
            onSelectionChange={handleRangeSelectionChange}
            showConfirm={false}
          />
        ) : (
          <DatePicker value={dateValue} onChange={handleSelect} />
        )}
      </PopoverContent>
    </Popover>
  );
}
