import { Button, Card, CardContent, Input } from "@sol/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DateRangePicker } from "@/shared/ui";

export type BookingWindowPickerVariant = "full" | "calendar" | "relative";

interface BookingWindowPickerProps {
  bookingWindowFrom?: string;
  bookingWindowTo?: string;
  bookingWindowFromDays: number | null;
  bookingWindowToDays: number | null;
  /** `full`: calendar + relative (default). `calendar` / `relative`: single mode for split table columns. */
  variant?: BookingWindowPickerVariant;
  onCommit: (values: {
    fromDays: number | null;
    toDays: number | null;
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export function BookingWindowPicker({
  bookingWindowFrom,
  bookingWindowTo,
  bookingWindowFromDays,
  bookingWindowToDays,
  variant = "full",
  onCommit,
}: BookingWindowPickerProps) {
  const { t } = useTranslation("admin");

  const [localFromDays, setLocalFromDays] = useState<number | null>(
    bookingWindowFromDays
  );
  const [localToDays, setLocalToDays] = useState<number | null>(
    bookingWindowToDays
  );
  const [localDateFrom, setLocalDateFrom] = useState(bookingWindowFrom ?? "");
  const [localDateTo, setLocalDateTo] = useState(bookingWindowTo ?? "");

  /** Days before travel must be ≥ 0 (relative booking window). */
  const parseNonNegativeDays = (v: string): number | null => {
    const t = v.trim();
    if (t === "") return null;
    const n = Number(t);
    if (Number.isNaN(n)) return null;
    return Math.max(0, Math.trunc(n));
  };

  const handleFromDaysChange = (v: string) => {
    setLocalFromDays(parseNonNegativeDays(v));
    setLocalDateFrom("");
    setLocalDateTo("");
  };

  const handleToDaysChange = (v: string) => {
    setLocalToDays(parseNonNegativeDays(v));
    setLocalDateFrom("");
    setLocalDateTo("");
  };

  const handleDateSelectionChange = (from: string, to: string) => {
    setLocalDateFrom(from);
    setLocalDateTo(to);
    if (from && to) {
      setLocalFromDays(null);
      setLocalToDays(null);
    }
  };

  const canConfirmCalendar = !!localDateFrom && !!localDateTo;
  const canConfirmRelative = localFromDays != null || localToDays != null;

  const commitCalendar = () => {
    onCommit({
      fromDays: null,
      toDays: null,
      dateFrom: localDateFrom,
      dateTo: localDateTo,
    });
  };

  const commitRelative = () => {
    onCommit({
      fromDays: localFromDays,
      toDays: localToDays,
      dateFrom: "",
      dateTo: "",
    });
  };

  const confirmButtonClass = "self-start disabled:opacity-40";

  const calendarCard = (
    <Card className="border-border bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 pt-4">
        <DateRangePicker
          from={localDateFrom || undefined}
          to={localDateTo || undefined}
          onConfirm={() => {}}
          onSelectionChange={handleDateSelectionChange}
          showConfirm={false}
        />
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          disabled={!canConfirmCalendar}
          onClick={commitCalendar}
          className={confirmButtonClass}
        >
          {t("buttons.confirm")}
        </Button>
      </CardContent>
    </Card>
  );

  const relativeFields = (
    <div className="flex min-w-0 flex-col rounded-md bg-gray-100 px-2 py-1">
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <label className="py-1 text-sm font-semibold text-foreground">
            {t("labels.from")}
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            className="h-9 bg-[#f9fafb] text-sm"
            value={localFromDays ?? ""}
            onChange={(e) => handleFromDaysChange(e.target.value)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <label className="py-1 text-sm font-semibold text-foreground">
            {t("labels.to")}
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            className="h-9 bg-[#f9fafb] text-sm"
            value={localToDays ?? ""}
            onChange={(e) => handleToDaysChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const relativeCard = (
    <Card className="border-border bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-base font-bold text-foreground">
            {t("labels.bookingWindowRelative")}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {t("labels.bookingWindowRelativeDescription")}
          </p>
        </div>
        {relativeFields}
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          disabled={!canConfirmRelative}
          onClick={commitRelative}
          className={confirmButtonClass}
        >
          {t("buttons.confirm")}
        </Button>
      </CardContent>
    </Card>
  );

  if (variant === "calendar") {
    return calendarCard;
  }

  if (variant === "relative") {
    return relativeCard;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="min-w-0 flex-1">{calendarCard}</div>
      <div className="min-w-0 flex-1">{relativeCard}</div>
    </div>
  );
}
