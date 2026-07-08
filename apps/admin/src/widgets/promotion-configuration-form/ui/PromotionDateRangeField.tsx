import { Button, Popover, PopoverContent, PopoverTrigger, cn } from "@sol/ui";
import { Calendar, CircleX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DatePickerGridInput, DateRangePicker } from "@/shared/ui";
import { formatPromotionDateRange } from "../lib/promotionDateDisplay";

const promotionDateFieldTriggerClassName =
  "h-9 flex-1 justify-start gap-2 rounded-none border-0 bg-transparent px-4 text-sm font-medium leading-6 text-text-primary hover:border-0 hover:bg-transparent focus-visible:rounded-none focus-visible:border-0";

const promotionDateFieldClearButtonClassName =
  "h-9 w-9 shrink-0 rounded-none border-0 bg-transparent text-brand-red hover:border-0 hover:bg-transparent hover:text-brand-red focus-visible:rounded-none focus-visible:border-0";

interface PromotionDateRangeFieldProps {
  label: string;
  from: string;
  to: string;
  onChange: (fromValue: string, toValue: string) => void;
  onClear?: () => void;
  hasError: boolean;
  pickerVariant?: "inputs" | "calendar";
}

export function PromotionDateRangeField({
  label,
  from,
  to,
  onChange,
  onClear,
  hasError,
  pickerVariant = "inputs",
}: PromotionDateRangeFieldProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [open, setOpen] = useState(false);
  const displayValue =
    formatPromotionDateRange(from, to) ?? t("admin:labels.selectDates");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex min-h-9 items-stretch bg-white",
          hasError && "bg-error-bg"
        )}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              promotionDateFieldTriggerClassName,
              hasError && "text-text-error"
            )}
          >
            <Calendar
              className={cn(
                "size-5 shrink-0 text-border-secondary",
                hasError && "text-text-error"
              )}
            />
            <span className="truncate">{displayValue}</span>
          </Button>
        </PopoverTrigger>
        {onClear && (from || to) ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={promotionDateFieldClearButtonClassName}
            aria-label={label}
            onClick={onClear}
          >
            <CircleX className="size-4" />
          </Button>
        ) : null}
      </div>
      <PopoverContent
        className={cn(
          pickerVariant === "calendar"
            ? "w-auto border-none bg-transparent p-0 shadow-none"
            : "w-[332px] p-3"
        )}
        align="start"
      >
        {pickerVariant === "calendar" ? (
          <DateRangePicker
            title={label}
            from={from}
            to={to}
            variant="panel"
            onConfirm={(fromValue, toValue) => {
              onChange(fromValue, toValue);
              setOpen(false);
            }}
          />
        ) : (
          <div className="form-grid-compact gap-3">
            <DatePickerGridInput
              value={from}
              onChange={(value) => onChange(value, to)}
              placeholder={t("common:placeholders.selectStartDate")}
              className={cn(hasError && "border-destructive", "bg-white/70")}
              hasError={hasError}
            />
            <DatePickerGridInput
              value={to}
              onChange={(value) => onChange(from, value)}
              placeholder={t("common:placeholders.selectEndDate")}
              className={cn(hasError && "border-destructive", "bg-white/70")}
              hasError={hasError}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
