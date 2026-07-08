import { Button, Popover, PopoverContent, PopoverTrigger, cn } from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { Calendar, CircleX } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatPromotionRelativeRange } from "../lib/promotionDateDisplay";
import { usePromotionFieldErrors } from "../lib/usePromotionFieldErrors";
import { clearFormScopedOnSubmitFieldErrorsByPrefix } from "@/shared/lib/form";
import { RelativeRangePicker, type AnyFormApi } from "@/shared/ui";

const promotionRelativeRangeFieldTriggerClassName =
  "h-9 flex-1 justify-start gap-2 rounded-none border-0 bg-transparent px-4 text-sm font-medium leading-6 text-text-primary hover:border-0 hover:bg-transparent focus-visible:rounded-none focus-visible:border-0";

const promotionRelativeRangeFieldClearButtonClassName =
  "h-9 w-9 shrink-0 rounded-none border-0 bg-transparent text-brand-red hover:border-0 hover:bg-transparent hover:text-brand-red focus-visible:rounded-none focus-visible:border-0";

interface PromotionRelativeRangeFieldProps {
  form: AnyFormApi;
  hasError: boolean;
  onClear?: () => void;
}

export function PromotionRelativeRangeField({
  form,
  hasError,
  onClear,
}: PromotionRelativeRangeFieldProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [open, setOpen] = useState(false);
  const [pendingFromDays, setPendingFromDays] = useState<number | null>(null);
  const [pendingToDays, setPendingToDays] = useState<number | null>(null);
  const values = useStore(form.store, (state) => {
    const formState = state as {
      values: {
        bookingWindowRelative: {
          fromDays: number | null;
          toDays: number | null;
        };
      };
    };

    return formState.values.bookingWindowRelative;
  });

  const displayValue =
    formatPromotionRelativeRange(values.fromDays, values.toDays, t) ??
    t("admin:placeholders.selectRange");
  const label = t("admin:labels.bookingWindowRelative");
  const fromErrors = usePromotionFieldErrors(
    form,
    "bookingWindowRelative.fromDays"
  );
  const toErrors = usePromotionFieldErrors(
    form,
    "bookingWindowRelative.toDays"
  );

  useEffect(() => {
    if (!open) return;

    setPendingFromDays(values.fromDays);
    setPendingToDays(values.toDays);
  }, [open, values.fromDays, values.toDays]);

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
              promotionRelativeRangeFieldTriggerClassName,
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
        {onClear && (values.fromDays !== null || values.toDays !== null) ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={promotionRelativeRangeFieldClearButtonClassName}
            aria-label={label}
            onClick={onClear}
          >
            <CircleX className="size-4" />
          </Button>
        ) : null}
      </div>
      <PopoverContent
        className="w-auto border-none bg-transparent p-0 shadow-none"
        align="start"
      >
        <RelativeRangePicker
          title={label}
          fromLabel={t("admin:labels.from")}
          toLabel={t("admin:labels.to")}
          fromValue={pendingFromDays}
          toValue={pendingToDays}
          fromPlaceholder={t(
            "admin:placeholders.bookingWindowRelativeFromExample"
          )}
          toPlaceholder={t("admin:placeholders.bookingWindowRelativeToExample")}
          hasFromError={fromErrors.length > 0}
          hasToError={toErrors.length > 0}
          onFromChange={setPendingFromDays}
          onToChange={setPendingToDays}
          onConfirm={() => {
            clearFormScopedOnSubmitFieldErrorsByPrefix(
              form,
              "bookingWindowRelative"
            );
            form.setFieldValue(
              "bookingWindowRelative.fromDays",
              pendingFromDays
            );
            form.setFieldValue("bookingWindowRelative.toDays", pendingToDays);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
