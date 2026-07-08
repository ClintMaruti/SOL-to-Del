import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@sol/ui";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Link2,
  RefreshCw,
  X,
} from "lucide-react";
import { useState } from "react";

export interface ExtraGuestCounts {
  adults: number;
  youth: number;
  children: number;
  infants: number;
}

export interface SelectedExtra {
  catalogExtraId: string;
  title: string;
  startDate: string;
  endDate: string;
  datesLocal: boolean;
  isMandatory: boolean;
  /** Set when the extra's charge type is "Unit" (e.g. PUPS) — a fixed quantity. */
  quantity?: number;
  /** Set when the extra's charge type is "Person" (e.g. PPPN) — a guest subset. */
  guestCounts?: ExtraGuestCounts;
  /** Computed client price for the chosen quantity/guest subset. */
  totalPrice?: number;
  /** Drives the PPPN/PUPS label next to the price. */
  chargeType?: "Person" | "Unit";
}

interface ExtraDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extra: SelectedExtra;
  serviceName: string;
  serviceStartDate: string;
  serviceEndDate: string;
  onSave: (updated: SelectedExtra) => void;
}

// ─── Mini calendar ────────────────────────────────────────────────────────────

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

interface DateRangeCalendarProps {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
  onConfirm: (start: string, end: string) => void;
  onReset: () => void;
}

function DateRangeCalendar({
  startDate,
  endDate,
  minDate,
  maxDate,
  onConfirm,
  onReset,
}: DateRangeCalendarProps) {
  const minD = parseDate(minDate)!;

  const initialMonth = parseDate(startDate) ?? minD;
  const [viewMonth, setViewMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [draft, setDraft] = useState({ start: startDate, end: endDate });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // First Monday on or before the 1st of the month
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const cells: { date: Date; thisMonth: boolean }[] = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, thisMonth: d.getMonth() === month });
  }

  function classFor(d: Date): string {
    const iso = toIso(d);
    const outOfBounds = iso < minDate || iso > maxDate;
    if (outOfBounds) return "cursor-not-allowed text-[#d1d5dc] bg-transparent";
    if (iso === draft.start && draft.start === draft.end)
      return "bg-[#931115] text-white rounded-md cursor-pointer";
    if (iso === draft.start)
      return "bg-[#931115] text-white rounded-l-md cursor-pointer";
    if (iso === draft.end)
      return "bg-[#931115] text-white rounded-r-md cursor-pointer";
    if (draft.start && draft.end && iso > draft.start && iso < draft.end)
      return "bg-[#fde8e8] text-[#931115] cursor-pointer";
    return "hover:bg-[#f3f4f6] cursor-pointer rounded-md";
  }

  function handleDayClick(iso: string) {
    if (iso < minDate || iso > maxDate) return;
    if (picking === "start") {
      setDraft({ start: iso, end: "" });
      setPicking("end");
    } else {
      if (iso < draft.start) {
        setDraft({ start: iso, end: draft.start });
      } else {
        setDraft({ start: draft.start, end: iso });
      }
      setPicking("start");
    }
  }

  const canConfirm = Boolean(draft.start && draft.end);

  return (
    <div className="mt-1 rounded-b-md border border-t-0 border-[#e5e7eb] bg-white p-3 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
      {/* Constraint notice */}
      <div className="mb-3 flex items-center gap-2 rounded-md border border-[#fde047] bg-[#fef9c3] px-2.5 py-1.5 text-[11px] font-medium text-[#854d0e]">
        <Calendar className="size-3 shrink-0" />
        Must stay within parent window: {minDate} – {maxDate}
      </div>

      {/* Nav */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="flex size-6 items-center justify-center rounded hover:bg-[#f3f4f6]"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-3.5 text-[#525252]" />
        </button>
        <span className="text-[13px] font-semibold text-[#171717]">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="flex size-6 items-center justify-center rounded hover:bg-[#f3f4f6]"
          aria-label="Next month"
        >
          <ChevronRight className="size-3.5 text-[#525252]" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold text-[#a1a1a1]"
          >
            {d}
          </div>
        ))}
        {cells.map(({ date, thisMonth }) => {
          const iso = toIso(date);
          return (
            <div
              key={iso}
              onClick={() => handleDayClick(iso)}
              className={`py-1 text-center text-[11px] ${thisMonth ? "text-[#171717]" : "text-[#d1d5dc]"} ${classFor(date)}`}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 border-t border-[#f3f4f6] pt-2 text-[10px] text-[#525252]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#931115]" />
          Selected range
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#e5e7eb] bg-[#f3f4f6]" />
          Outside parent window
        </span>
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-[#0369a1] hover:underline"
        >
          <RefreshCw className="size-3" />
          Reset to follow service
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => canConfirm && onConfirm(draft.start, draft.end)}
          className="rounded-md bg-[#931115] px-3 py-1 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ─── ExtraDetailModal ─────────────────────────────────────────────────────────

export function ExtraDetailModal({
  open,
  onOpenChange,
  extra,
  serviceName,
  serviceStartDate,
  serviceEndDate,
  onSave,
}: ExtraDetailModalProps) {
  const [draft, setDraft] = useState<SelectedExtra>(extra);
  const [calendarOpen, setCalendarOpen] = useState(false);

  function handleDateConfirm(start: string, end: string) {
    setDraft((d) => ({
      ...d,
      startDate: start,
      endDate: end,
      datesLocal: true,
    }));
    setCalendarOpen(false);
  }

  function handleDateReset() {
    setDraft((d) => ({
      ...d,
      startDate: serviceStartDate,
      endDate: serviceEndDate,
      datesLocal: false,
    }));
    setCalendarOpen(false);
  }

  function handleSave() {
    onSave(draft);
    onOpenChange(false);
  }

  const effectiveStart = draft.datesLocal ? draft.startDate : serviceStartDate;
  const effectiveEnd = draft.datesLocal ? draft.endDate : serviceEndDate;

  const datesLabel = draft.datesLocal
    ? `${effectiveStart} → ${effectiveEnd}`
    : "follows service";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setCalendarOpen(false);
          setDraft(extra);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] max-w-[720px] flex-col gap-0 overflow-visible p-0 sm:max-w-[720px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {extra.title} — {serviceName}
          </DialogTitle>
        </DialogHeader>

        {/* Topbar / breadcrumb */}
        <div className="flex shrink-0 items-center justify-between rounded-tl-xl rounded-tr-xl border-b border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#525252]">
            <ArrowLeft className="size-3.5" />
            <span>{serviceName}</span>
            <ChevronRight className="size-3 text-[#a1a1a1]" />
            <span className="font-semibold text-[#171717]">{extra.title}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-5 items-center justify-center text-[#525252] hover:opacity-70"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Service header strip */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-[#525252]">Extra</p>
              <p className="text-[16px] font-bold text-[#171717]">
                {extra.title}
              </p>
            </div>
            <div className="shrink-0 rounded-md bg-[#e5e7eb] px-3 py-1.5 text-right text-[10px] font-semibold text-[#525252]">
              Parent window: {serviceStartDate} – {serviceEndDate}
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#e5e7eb] px-3 py-0.5 text-[11px] font-medium text-[#525252]">
              New
            </span>
            {draft.datesLocal ? (
              <span className="flex items-center gap-1 rounded border border-[#fde047] bg-[#fef9c3] px-1.5 py-0.5 text-[10px] font-semibold text-[#854d0e]">
                <Calendar className="size-2.5" />
                custom dates
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded border border-[#7dd3fc] bg-[#e0f2fe] px-1.5 py-0.5 text-[10px] font-semibold text-[#0369a1]">
                <Link2 className="size-2.5" />
                follows service
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white">
          <div className="flex px-4">
            {(["Details", "Supplier", "Notes"] as const).map((tab) => (
              <div
                key={tab}
                className={`border-b-2 px-4 py-2.5 text-[13px] font-medium ${
                  tab === "Details"
                    ? "border-[#931115] text-[#931115]"
                    : "border-transparent text-[#525252]"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 divide-x divide-[#e5e7eb]">
            {/* Left: assignment */}
            <div className="p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#a1a1a1]">
                Assignment
              </p>

              <div className="mb-4 overflow-visible rounded-md border border-[#e5e7eb]">
                {/* Dates row */}
                <div className="relative">
                  <div
                    className={`flex cursor-pointer items-center px-3 py-2.5 transition-colors ${calendarOpen ? "bg-[#fafafa]" : "hover:bg-[#fafafa]"}`}
                    onClick={() => setCalendarOpen((o) => !o)}
                  >
                    <span className="flex-1 text-[12px] text-[#525252]">
                      Dates
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-[12px] font-semibold ${draft.datesLocal ? "text-[#854d0e]" : "text-[#0369a1]"}`}
                    >
                      {datesLabel}
                      <Calendar className="size-3 text-[#a1a1a1]" />
                    </span>
                  </div>
                  {calendarOpen && (
                    <DateRangeCalendar
                      startDate={effectiveStart}
                      endDate={effectiveEnd}
                      minDate={serviceStartDate}
                      maxDate={serviceEndDate}
                      onConfirm={handleDateConfirm}
                      onReset={handleDateReset}
                    />
                  )}
                </div>

                <div className="flex items-center border-t border-[#e5e7eb] px-3 py-2.5">
                  <span className="flex-1 text-[12px] text-[#525252]">
                    Travelers
                  </span>
                  <span className="text-[12px] font-semibold text-[#0369a1]">
                    follows service
                  </span>
                </div>

                <div className="flex items-center border-t border-[#e5e7eb] px-3 py-2.5">
                  <span className="flex-1 text-[12px] text-[#525252]">
                    Type
                  </span>
                  <span className="text-[12px] font-medium text-[#525252]">
                    Extra
                  </span>
                </div>
              </div>

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#a1a1a1]">
                Notes
              </p>
              <textarea
                rows={3}
                className="w-full resize-none rounded-md border border-[#e5e7eb] px-3 py-2 text-[12px] text-[#171717] outline-none focus:border-[#931115] focus:ring-1 focus:ring-[#931115]/30"
                placeholder="Internal notes…"
              />
            </div>

            {/* Right: rate breakdown placeholder */}
            <div
              className={`p-4 transition-opacity ${calendarOpen ? "pointer-events-none opacity-40" : ""}`}
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#a1a1a1]">
                Rate breakdown
              </p>
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-md border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-6 text-center">
                <p className="text-[12px] font-medium text-[#525252]">
                  Rates available after service is saved
                </p>
                <p className="mt-1 text-[11px] text-[#a1a1a1]">
                  Contracted rates load from the supplier's contract
                </p>
              </div>

              <div className="mt-4 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#525252]">
                    Effective dates
                  </span>
                  <span className="text-[12px] font-semibold text-[#171717]">
                    {effectiveStart} – {effectiveEnd}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between rounded-bl-xl rounded-br-xl border-t border-[#e5e7eb] bg-white px-4 py-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-medium text-[#525252] hover:bg-[#f9fafb]"
          >
            <ArrowLeft className="size-3.5" />
            Back to service
          </button>
          <button
            type="button"
            disabled={calendarOpen}
            onClick={handleSave}
            className="rounded-md bg-[#931115] px-4 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save extra
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
