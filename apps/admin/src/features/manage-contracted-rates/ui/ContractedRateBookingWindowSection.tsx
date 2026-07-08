import { Button, Popover, PopoverContent, PopoverTrigger } from "@sol/ui";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDate } from "@/shared/lib";
import { DateRangePicker } from "@/shared/ui";

export type BookingWindowRow = {
  bookingWindowFrom: string | null;
  bookingWindowTo: string | null;
};

function formatBookingRange(
  from: string | null,
  to: string | null
): string | null {
  if (!from && !to) return null;
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  return to ? formatDate(to) : null;
}

interface ContractedRateBookingWindowSectionProps {
  rows: BookingWindowRow[];
  onRowsChange: (rows: BookingWindowRow[]) => void;
  onAddRow: () => void;
}

export function ContractedRateBookingWindowSection({
  rows,
  onRowsChange,
  onAddRow,
}: ContractedRateBookingWindowSectionProps) {
  const { t } = useTranslation(["admin", "common"]);

  const updateRow = (index: number, patch: Partial<BookingWindowRow>) => {
    onRowsChange(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {t("sections.bookingWindow")}
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

      {rows.length > 0 ? (
        <div className="w-full overflow-hidden rounded-[6px] border border-border-tertiary">
          <div className="grid grid-cols-[1fr_115px] border-b border-border-tertiary bg-gray-100">
            <div className="px-4 py-2 text-sm font-semibold text-foreground">
              {t("labels.bookingWindow")}
            </div>
            <div className="border-l border-border-tertiary px-3 py-2 text-right text-sm font-semibold text-foreground">
              {t("tableHeaders.actions")}
            </div>
          </div>
          {rows.map((row, index) => (
            <BookingWindowRowEditor
              key={index}
              row={row}
              onChange={(patch) => updateRow(index, patch)}
              onRemove={() => removeRow(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BookingWindowRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: BookingWindowRow;
  onChange: (patch: Partial<BookingWindowRow>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation(["admin", "common"]);
  const [open, setOpen] = useState(false);
  const range = formatBookingRange(row.bookingWindowFrom, row.bookingWindowTo);

  return (
    <div className="grid grid-cols-[1fr_115px] border-b border-border-tertiary bg-white last:border-b-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-9 min-h-9 w-full justify-start gap-2 rounded-none px-4 text-sm font-medium text-foreground hover:bg-transparent"
          >
            <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="truncate">{range ?? t("labels.selectDates")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <DateRangePicker
            from={row.bookingWindowFrom ?? undefined}
            to={row.bookingWindowTo ?? undefined}
            onConfirm={(from, to) => {
              onChange({ bookingWindowFrom: from, bookingWindowTo: to });
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <div className="flex min-h-9 items-center justify-end border-l border-border-tertiary pr-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none"
          onClick={onRemove}
          aria-label={t("common:buttons.delete")}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
