import { useTranslation } from "@sol/i18n";
import { Button, cn, Popover, PopoverContent, PopoverTrigger } from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { Calendar, CircleXIcon } from "lucide-react";
import { useState } from "react";

import type { RateFormSubmitData } from "@/features/manage-service-option-rates";
import { DateRangePicker } from "@/shared/ui";

import { formatDateRange } from "../lib/formatDate";

import type { ContractedRateRowProps } from "./ContractedRateRow";

interface BookingWIndowItemProps extends Pick<
  ContractedRateRowProps,
  "form" | "crIndex"
> {
  numberOfTravelDates: number;
  hasBookingWindowError?: boolean;
  crFieldPrefix: string;
}

export const BookingWindowItem: React.FC<BookingWIndowItemProps> = ({
  form,
  crIndex,
  numberOfTravelDates,
  hasBookingWindowError,
  crFieldPrefix,
}) => {
  const { t } = useTranslation("admin");
  const bookingFrom = useStore(form.store, (s) => {
    const values = (s as { values: RateFormSubmitData }).values;
    return (values.contractedRates?.[crIndex]?.bookingWindowFrom ?? "").trim();
  });
  const bookingTo = useStore(form.store, (s) => {
    const values = (s as { values: RateFormSubmitData }).values;
    return (values.contractedRates?.[crIndex]?.bookingWindowTo ?? "").trim();
  });
  const [bookingWindowOpen, setBookingWindowOpen] = useState(false);
  const bookingRange = formatDateRange(bookingFrom, bookingTo);
  const multiTravel = numberOfTravelDates > 1;
  return (
    <div
      className={cn(
        "flex items-center gap-1 flex-1 min-w-0",
        multiTravel && !hasBookingWindowError
      )}
    >
      <div
        className={cn(
          "flex min-h-9 flex-1 min-w-0",
          hasBookingWindowError &&
            cn(
              "border-t border-b border-destructive bg-error-bg",
              multiTravel ? "border-r-0" : "border-r border-destructive"
            )
        )}
      >
        <Popover open={bookingWindowOpen} onOpenChange={setBookingWindowOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-label={t("labels.bookingWindow")}
              aria-invalid={!!hasBookingWindowError}
              className={cn(
                "flex h-9 flex-1 min-w-0 justify-start gap-2 rounded-none px-2 text-sm font-medium text-foreground",
                hasBookingWindowError && "hover:bg-inherit bg-transparent"
              )}
            >
              <Calendar
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground",
                  hasBookingWindowError && "text-red-600"
                )}
              />
              <span className="truncate">
                {bookingRange ?? t("labels.selectDates")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <DateRangePicker
              from={bookingFrom || undefined}
              to={bookingTo || undefined}
              onConfirm={(from, to) => {
                form.setFieldValue(`${crFieldPrefix}.bookingWindowFrom`, from);
                form.setFieldValue(`${crFieldPrefix}.bookingWindowTo`, to);
                setBookingWindowOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {bookingFrom && bookingTo && (
        <Button
          size="icon-sm"
          variant="default"
          className="bg-transparent hover:bg-transparent text-brand-red shrink-0"
          aria-label={t("aria.removeDate")}
          onClick={() => {
            form.setFieldValue(`${crFieldPrefix}.bookingWindowFrom`, "");
            form.setFieldValue(`${crFieldPrefix}.bookingWindowTo`, "");
          }}
        >
          <CircleXIcon className="size-5" />
        </Button>
      )}
    </div>
  );
};
