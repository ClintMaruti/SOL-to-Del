import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import { Calendar, CircleX, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ComponentDateRow } from "@/entities/service-option-rate-plan";
import { formatDate } from "@/shared/lib";
import { DateRangePicker, type AnyFormApi } from "@/shared/ui";

import { createComponentDateRow } from "../lib/defaults";

import { BookingWindowPicker } from "./BookingWindowPicker";

interface ComponentDatesTableProps {
  form: AnyFormApi;
  /** Parent component path, e.g. `rateRules[0].components[1]` */
  componentFieldPrefix: string;
  dates: ComponentDateRow[];
  bookingWindowFrom: string | null;
  bookingWindowTo: string | null;
  bookingWindowFromDays: number | null;
  bookingWindowToDays: number | null;
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

export function ComponentDatesTable({
  form,
  componentFieldPrefix,
  dates,
  bookingWindowFrom,
  bookingWindowTo,
  bookingWindowFromDays,
  bookingWindowToDays,
  actionsLocked = false,
  actionsLockedTitle,
}: ComponentDatesTableProps) {
  const { t } = useTranslation("admin");
  const datesFieldPrefix = `${componentFieldPrefix}.componentDates`;

  const updateTravelDates = (index: number, from: string, to: string) => {
    form.setFieldValue(`${datesFieldPrefix}[${index}].travelDateFrom`, from);
    form.setFieldValue(`${datesFieldPrefix}[${index}].travelDateTo`, to);
  };

  const removeTravelDateRow = (index: number) => {
    form.setFieldValue(
      datesFieldPrefix,
      dates.filter((_, i) => i !== index)
    );
  };

  const addTravelDateRow = () => {
    form.setFieldValue(datesFieldPrefix, [...dates, createComponentDateRow()]);
  };

  const commitBookingCalendar = (from: string, to: string) => {
    form.setFieldValue(
      `${componentFieldPrefix}.bookingWindowFrom`,
      from || null
    );
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowTo`, to || null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowFromDays`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowToDays`, null);
  };

  const commitBookingRelative = (
    fromDays: number | null,
    toDays: number | null
  ) => {
    form.setFieldValue(
      `${componentFieldPrefix}.bookingWindowFromDays`,
      fromDays
    );
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowToDays`, toDays);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowFrom`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowTo`, null);
  };

  const clearBookingCalendar = () => {
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowFrom`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowTo`, null);
  };

  const clearBookingRelative = () => {
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowFromDays`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowToDays`, null);
  };

  const removeEntireDatesSection = () => {
    form.setFieldValue(datesFieldPrefix, []);
    form.setFieldValue(
      `${componentFieldPrefix}.bookingWindowId`,
      `tmp-component-bw-${crypto.randomUUID()}`
    );
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowFrom`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowTo`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowFromDays`, null);
    form.setFieldValue(`${componentFieldPrefix}.bookingWindowToDays`, null);
  };

  return (
    <div className="overflow-x-auto rounded-[6px] border border-border">
      <Table className="w-full min-w-[48rem] table-fixed border-separate border-spacing-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 w-[35%] border-r border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-neutral-900">
              {t("labels.travelDates")}
              <span className="text-[#f54a00]">*</span>
            </TableHead>
            <TableHead className="h-9 w-[28%] border-r border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-neutral-900">
              {t("labels.bookingWindow")}
            </TableHead>
            <TableHead className="h-9 w-[28%] border-r border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-neutral-900">
              {t("labels.bookingWindowRelative")}
            </TableHead>
            <TableHead className="h-9 w-[4%] min-w-[48px] rounded-tr-[6px] border-l border-border bg-gray-300 pl-4 pr-2 text-right">
              <div className="flex h-full items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-brand-red hover:text-destructive"
                  disabled={actionsLocked}
                  title={actionsLocked ? actionsLockedTitle : undefined}
                  aria-label={t("aria.removeComponentDatesSection")}
                  onClick={removeEntireDatesSection}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="border-b-0 bg-white hover:bg-transparent">
            <TableCell className="overflow-hidden rounded-bl-[6px] border-r border-border p-0 align-top">
              <div className="flex flex-col">
                {dates.map((row, index) => (
                  <TravelDateIntervalRow
                    key={row.id}
                    row={row}
                    isLast={index === dates.length - 1}
                    onTravelDatesConfirm={(from, to) =>
                      updateTravelDates(index, from, to)
                    }
                    onRemoveRow={() => removeTravelDateRow(index)}
                    onAddRow={addTravelDateRow}
                    actionsLocked={actionsLocked}
                    actionsLockedTitle={actionsLockedTitle}
                  />
                ))}
              </div>
            </TableCell>

            <TableCell className="border-r border-border p-0 align-top">
              <BookingWindowColumn
                bookingWindowFrom={bookingWindowFrom}
                bookingWindowTo={bookingWindowTo}
                bookingWindowFromDays={bookingWindowFromDays}
                bookingWindowToDays={bookingWindowToDays}
                onCommitCalendar={(values) => {
                  commitBookingCalendar(values.dateFrom, values.dateTo);
                }}
                onClearCalendar={clearBookingCalendar}
                actionsLocked={actionsLocked}
                actionsLockedTitle={actionsLockedTitle}
              />
            </TableCell>

            <TableCell colSpan={2} className="rounded-br-[6px] p-0 align-top">
              <BookingWindowRelativeColumn
                bookingWindowFrom={bookingWindowFrom}
                bookingWindowTo={bookingWindowTo}
                bookingWindowFromDays={bookingWindowFromDays}
                bookingWindowToDays={bookingWindowToDays}
                onCommitRelative={(values) => {
                  commitBookingRelative(values.fromDays, values.toDays);
                }}
                onClearRelative={clearBookingRelative}
                actionsLocked={actionsLocked}
                actionsLockedTitle={actionsLockedTitle}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

const formatRange = (from: string, to: string) => {
  if (!from && !to) return null;
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  return formatDate(to);
};

interface TravelDateIntervalRowProps {
  row: ComponentDateRow;
  isLast: boolean;
  onTravelDatesConfirm: (from: string, to: string) => void;
  onRemoveRow: () => void;
  onAddRow: () => void;
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

function TravelDateIntervalRow({
  row,
  isLast,
  onTravelDatesConfirm,
  onRemoveRow,
  onAddRow,
  actionsLocked = false,
  actionsLockedTitle,
}: TravelDateIntervalRowProps) {
  const { t } = useTranslation("admin");
  const [travelOpen, setTravelOpen] = useState(false);
  const travelRange = formatRange(row.travelDateFrom, row.travelDateTo);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-stretch border-b border-border",
        isLast && "rounded-bl-[6px] border-b-0"
      )}
    >
      <Popover open={travelOpen} onOpenChange={setTravelOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex min-h-[36px] min-w-0 flex-1 justify-start gap-2 rounded-none border-0 bg-inherit px-4 text-sm font-medium text-foreground shadow-none hover:border-transparent hover:bg-muted/30 focus-visible:border-0"
          >
            <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
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
              onTravelDatesConfirm(from, to);
              setTravelOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-none border-0 bg-inherit shadow-none hover:border-transparent focus-visible:border-0"
        disabled={actionsLocked}
        title={actionsLocked ? actionsLockedTitle : undefined}
        aria-label={t("aria.removeTravelDateRow")}
        onClick={onRemoveRow}
      >
        <CircleX
          className={cn(
            "h-5 w-5 shrink-0",
            actionsLocked ? "text-muted-foreground" : "text-brand-red"
          )}
        />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-none border-0 bg-inherit shadow-none hover:border-transparent focus-visible:border-0"
        disabled={actionsLocked}
        title={actionsLocked ? actionsLockedTitle : undefined}
        onClick={onAddRow}
      >
        <Plus
          className={cn(
            "h-5 w-5 shrink-0",
            actionsLocked ? "text-muted-foreground" : "text-brand-red"
          )}
        />
      </Button>
    </div>
  );
}

interface BookingColumnSharedProps {
  bookingWindowFrom: string | null;
  bookingWindowTo: string | null;
  bookingWindowFromDays: number | null;
  bookingWindowToDays: number | null;
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

function BookingWindowColumn({
  bookingWindowFrom,
  bookingWindowTo,
  bookingWindowFromDays,
  bookingWindowToDays,
  onCommitCalendar,
  onClearCalendar,
  actionsLocked = false,
  actionsLockedTitle,
}: BookingColumnSharedProps & {
  onCommitCalendar: (values: {
    fromDays: number | null;
    toDays: number | null;
    dateFrom: string;
    dateTo: string;
  }) => void;
  onClearCalendar: () => void;
}) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = useState(false);

  const bookingDateRange = formatRange(
    bookingWindowFrom ?? "",
    bookingWindowTo ?? ""
  );
  const hasDays = bookingWindowFromDays != null || bookingWindowToDays != null;
  const hasDates = !!bookingDateRange;
  const hasBookingCalendarValue = hasDates && !hasDays;

  return (
    <div className="flex min-h-[36px] w-full min-w-0 flex-col bg-white">
      <div className="flex w-full min-w-0 items-stretch">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex min-h-[36px] w-full min-w-0 flex-1 justify-start gap-2 rounded-none border-0 bg-inherit px-4 text-sm font-medium text-foreground shadow-none hover:border-transparent hover:bg-muted/30 focus-visible:border-0"
              disabled={actionsLocked}
            >
              <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground">
                {hasDays
                  ? t("labels.selectDates")
                  : (bookingDateRange ?? t("labels.selectDates"))}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-0 bg-transparent p-0 shadow-none"
            align="start"
            alignOffset={-88}
            collisionPadding={16}
          >
            <BookingWindowPicker
              variant="calendar"
              bookingWindowFrom={bookingWindowFrom || undefined}
              bookingWindowTo={bookingWindowTo || undefined}
              bookingWindowFromDays={bookingWindowFromDays}
              bookingWindowToDays={bookingWindowToDays}
              onCommit={(values) => {
                onCommitCalendar(values);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        {hasBookingCalendarValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none border-0 bg-inherit shadow-none hover:border-transparent focus-visible:border-0"
            disabled={actionsLocked}
            title={actionsLocked ? actionsLockedTitle : undefined}
            onClick={onClearCalendar}
          >
            <CircleX className="h-5 w-5 shrink-0 text-brand-red" />
          </Button>
        )}
      </div>
    </div>
  );
}

function BookingWindowRelativeColumn({
  bookingWindowFrom,
  bookingWindowTo,
  bookingWindowFromDays,
  bookingWindowToDays,
  onCommitRelative,
  onClearRelative,
  actionsLocked = false,
  actionsLockedTitle,
}: BookingColumnSharedProps & {
  onCommitRelative: (values: {
    fromDays: number | null;
    toDays: number | null;
    dateFrom: string;
    dateTo: string;
  }) => void;
  onClearRelative: () => void;
}) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = useState(false);

  const hasDays = bookingWindowFromDays != null || bookingWindowToDays != null;
  const bookingDaysText = hasDays
    ? `${bookingWindowFromDays ?? ""} - ${bookingWindowToDays ?? ""} ${t("labels.days")}`
    : null;
  return (
    <div className="flex min-h-[36px] w-full min-w-0 flex-col bg-white">
      <div className="flex w-full min-w-0 items-stretch">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex min-h-[36px] w-full min-w-0 flex-1 justify-start gap-2 rounded-none border-0 bg-inherit px-4 text-sm font-medium text-foreground shadow-none hover:border-transparent hover:bg-muted/30 focus-visible:border-0"
              disabled={actionsLocked}
            >
              <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
              {bookingDaysText ? (
                <span className="truncate">
                  <span className="text-foreground">{bookingDaysText}</span>{" "}
                  <span className="text-[#a1a1a1]">
                    {t("labels.beforeTravelDates")}
                  </span>
                </span>
              ) : (
                <span className="truncate text-foreground">
                  {t("placeholders.selectRange")}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-0 bg-transparent p-0 shadow-none"
            align="start"
            alignOffset={-88}
            collisionPadding={16}
          >
            <BookingWindowPicker
              variant="relative"
              bookingWindowFrom={bookingWindowFrom || undefined}
              bookingWindowTo={bookingWindowTo || undefined}
              bookingWindowFromDays={bookingWindowFromDays}
              bookingWindowToDays={bookingWindowToDays}
              onCommit={(values) => {
                onCommitRelative(values);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        {hasDays && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none border-0 bg-inherit shadow-none hover:border-transparent focus-visible:border-0"
            disabled={actionsLocked}
            title={actionsLocked ? actionsLockedTitle : undefined}
            onClick={onClearRelative}
          >
            <CircleX className="h-5 w-5 shrink-0 text-brand-red" />
          </Button>
        )}
      </div>
    </div>
  );
}
