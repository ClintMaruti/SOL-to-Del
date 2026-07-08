import { Popover, PopoverContent, PopoverTrigger, cn } from "@sol/ui";
import { CalendarIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DatePicker } from "./DatePicker";
import { formatDateDDMMMYYYY, parseISODate, toISODateString } from "./utils";

interface DatePickerGridInputFooterContext {
  close: () => void;
  open: boolean;
}

export interface DatePickerGridInputProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "onChange" | "value"
> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  popoverContentClassName?: string;
  hasError?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  closeOnSelect?: boolean;
  footer?:
    | ReactNode
    | ((context: DatePickerGridInputFooterContext) => ReactNode);
}

export function DatePickerGridInput({
  value,
  onChange,
  placeholder,
  className,
  popoverContentClassName,
  id,
  disabled,
  hasError,
  isDateDisabled,
  closeOnSelect = true,
  footer,
  "aria-invalid": ariaInvalid,
  ...buttonProps
}: DatePickerGridInputProps) {
  const { t } = useTranslation("common");
  const monthsShort = t("calendar.monthsShort", {
    returnObjects: true,
  }) as string[];
  const [open, setOpen] = useState(false);
  const dateValue = useMemo(
    () => (value ? parseISODate(value) : null),
    [value]
  );
  const effectivePlaceholder = placeholder ?? t("placeholders.selectDate");
  const close = useCallback(() => setOpen(false), [setOpen]);
  const isInvalid = hasError || ariaInvalid === true || ariaInvalid === "true";

  const handleSelect = useCallback(
    (date: Date) => {
      onChange?.(toISODateString(date));
      if (closeOnSelect) {
        setOpen(false);
      }
    },
    [closeOnSelect, onChange, setOpen]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          {...buttonProps}
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={isInvalid ? "true" : ariaInvalid}
          className={cn(
            "border-input flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-none transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-[color:var(--input-border-error)] aria-invalid:bg-[color:var(--input-bg-error)] aria-invalid:focus-visible:border-[color:var(--input-border-error)]",
            dateValue ? "text-text-primary" : "text-muted-foreground",
            isInvalid &&
              "border-[color:var(--input-border-error)] bg-[color:var(--input-bg-error)] ring-destructive/20 ring-1",
            open && !isInvalid && "border-[3px] border-red-200",
            className
          )}
        >
          <span className="truncate">
            {dateValue
              ? formatDateDDMMMYYYY(dateValue, monthsShort)
              : effectivePlaceholder}
          </span>
          <CalendarIcon
            className={cn(
              "ml-auto size-4 shrink-0 text-neutral-400",
              isInvalid && "text-[color:var(--input-border-error)]"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "flex w-auto flex-col gap-4 border-none bg-white p-3 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]",
          popoverContentClassName
        )}
      >
        <DatePicker
          value={dateValue}
          onChange={handleSelect}
          isDateDisabled={isDateDisabled}
        />
        {footer ? (
          <div className="w-full">
            {typeof footer === "function" ? footer({ close, open }) : footer}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
