import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@sol/ui";
import {
  Building2,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock,
  Compass,
  Globe,
  Info,
  MapPin,
  Minus,
  Pencil,
  Plane,
  Plus,
  Receipt,
  Search,
  SquareArrowRight,
  SquareCheckBig,
  SquarePlus,
  Star,
  Trash2,
  Truck,
  RefreshCw,
  X,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { useDestinations } from "@/entities/destination";
import { useSupplierExtras, type CatalogExtra } from "@/entities/catalog-extra";
import {
  useServiceSearch,
  type ServiceSearchResult,
} from "@/entities/supplier-services";
import { useSuppliers } from "@/entities/suppliers";
import { formatDate } from "@/shared/lib/formatDate";
import {
  DatePicker,
  DatePickerInput,
  DestinationTreeSelect,
} from "@/shared/ui";

import { useAddItineraryService } from "../api/useAddItineraryService";
import type { ServiceType } from "../model/types";
import {
  ExtraDetailModal,
  type ExtraGuestCounts,
  type SelectedExtra,
} from "./ExtraDetailModal";

// ─── Service type config ─────────────────────────────────────────────────────

interface ServiceTypeConfig {
  value: ServiceType;
  label: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
}

const SERVICE_TYPE_CONFIG: ServiceTypeConfig[] = [
  {
    value: "ACCOMMODATION",
    label: "Accommodation",
    icon: <Building2 className="size-4" />,
    color: "#00a63e",
    bg: "#d0fae5",
    border: "#00d492",
  },
  {
    value: "TRANSPORT",
    label: "Transportation",
    icon: <Truck className="size-4" />,
    color: "#b45309",
    bg: "#fff085",
    border: "#efb100",
  },
  {
    value: "FLIGHT",
    label: "Flight",
    icon: <Plane className="size-4" />,
    color: "#0369a1",
    bg: "#dff2fe",
    border: "#00bcff",
  },
  {
    value: "OTHERS",
    label: "Other",
    icon: <Globe className="size-4" />,
    color: "#62748e",
    bg: "#e2e8f0",
    border: "#62748e",
  },
  {
    value: "ACTIVITY",
    label: "Activity",
    icon: <Compass className="size-4" />,
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#8b5cf6",
  },
  {
    value: "FEE",
    label: "Fee",
    icon: <Receipt className="size-4" />,
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#0ea5e9",
  },
];

// Sub-types that appear under the "Other" group button
const OTHERS_GROUP = new Set<ServiceType>(["ACTIVITY", "FEE", "OTHERS"]);

// ─── CancellationPolicyModal ──────────────────────────────────────────────────

interface CancellationTier {
  label: string;
  percent: number;
}

interface CancellationPolicy {
  id: string;
  name: string;
  applicableDates: string;
  tiers: CancellationTier[];
}

const MOCK_CANCELLATION_POLICIES: CancellationPolicy[] = [
  {
    id: "peak",
    name: "Peak season",
    applicableDates: "06 Jan 2026 - 31 May 2026, 01 Aug 2026 - 31 Dec 2026",
    tiers: [
      { label: "Cancelled 90 days before arrival", percent: 25 },
      { label: "Cancelled 45 days before arrival", percent: 60 },
      { label: "Less than 15 days prior to arrival", percent: 100 },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    applicableDates: "06 Jan 2026 - 31 May 2026, 01 Aug 2026 - 31 Dec 2026",
    tiers: [
      { label: "Cancelled 90 days before arrival", percent: 20 },
      { label: "Cancelled 45 days before arrival", percent: 50 },
      { label: "Less than 15 days prior to arrival", percent: 100 },
    ],
  },
];

function CancellationPolicyModal({
  open,
  onOpenChange,
  travelDateFrom,
  travelDateTo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  travelDateFrom?: string;
  travelDateTo?: string | null;
}) {
  const [selected, setSelected] = useState<string>("peak");

  const dateLabel = (() => {
    if (!travelDateFrom) return null;
    const fmt = (d: string) =>
      new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
    return travelDateTo
      ? `${fmt(travelDateFrom)}-${fmt(travelDateTo)}`
      : fmt(travelDateFrom);
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[640px] flex-col gap-0 overflow-auto p-0 sm:max-w-[640px]">
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-dashed border-[#e5e7eb] px-6 py-4">
          <DialogTitle className="text-[18px] font-bold text-[#171717]">
            Cancellation Policy
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6">
          {/* Info banner */}
          {dateLabel && (
            <div className="flex items-start gap-2.5 rounded-lg bg-[#e0f2fe] px-4 py-3">
              <Info className="mt-0.5 size-4 shrink-0 text-[#0369a1]" />
              <p className="text-[13px] font-medium text-[#0369a1]">
                Two policies apply to these travel dates ({dateLabel}). Select
                the stricter one.
              </p>
            </div>
          )}

          {/* Policy cards */}
          <div className="flex flex-col gap-3">
            {MOCK_CANCELLATION_POLICIES.map((policy) => {
              const isOn = selected === policy.id;
              return (
                <div
                  key={policy.id}
                  className="rounded-lg border border-[#e5e7eb] bg-white p-4"
                >
                  {/* Header row */}
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[16px] font-bold text-[#171717]">
                      {policy.name}
                    </span>
                    {/* Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      onClick={() => setSelected(policy.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        isOn ? "bg-[#8B1515]" : "bg-[#d1d5dc]"
                      }`}
                    >
                      <span
                        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                          isOn ? "translate-x-[22px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Applicable dates */}
                  <p className="mb-3 text-[12px] text-[#a1a1a1]">
                    <span className="font-medium text-[#525252]">
                      Applicable during:
                    </span>{" "}
                    {policy.applicableDates}
                  </p>

                  {/* Tiers table */}
                  <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
                    {policy.tiers.map((tier, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-2.5 last:border-0"
                      >
                        <span className="text-[13px] text-[#171717]">
                          {tier.label}
                        </span>
                        <span className="text-[13px] font-bold text-[#171717]">
                          {tier.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-[#e5e7eb] px-6 py-4">
          <Button
            type="button"
            variant="primary"
            onClick={() => onOpenChange(false)}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── HoldServiceModal ────────────────────────────────────────────────────────

function HoldServiceModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (date: Date) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelectedDate(null);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] max-w-[640px] flex-col gap-0 overflow-auto p-0 sm:max-w-[640px]"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-dashed border-[#e5e7eb] px-6 py-4 text-left">
          <div>
            <DialogTitle className="text-[18px] font-bold leading-6 text-[#171717]">
              Hold Service
            </DialogTitle>
            <p className="mt-1 text-[13px] leading-4 text-[#525252]">
              Add an expiration date for your hold
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        <div className="p-6">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e5e7eb] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!selectedDate}
            onClick={() => {
              if (selectedDate) onConfirm(selectedDate);
            }}
          >
            Put on hold
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditTravelDatesModal ────────────────────────────────────────────────────

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CAL_MONTHS = [
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

function calToIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calAddMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function MonthGrid({
  viewMonth,
  draft,
  onDayClick,
}: {
  viewMonth: Date;
  draft: { start: string; end: string };
  onDayClick: (iso: string) => void;
}) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - firstDay.getDay());

  const cells: { date: Date; thisMonth: boolean }[] = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, thisMonth: d.getMonth() === month });
  }

  function classFor(iso: string): string {
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

  return (
    <div>
      <p className="mb-2 text-center text-[14px] font-semibold text-[#171717]">
        {CAL_MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0.5">
        {CAL_DAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-medium text-[#a1a1a1]"
          >
            {d}
          </div>
        ))}
        {cells.map(({ date, thisMonth }) => {
          const iso = calToIso(date);
          return (
            <div
              key={iso}
              onClick={() => onDayClick(iso)}
              className={`py-1.5 text-center text-[13px] ${thisMonth ? "text-[#171717]" : "text-[#d1d5dc]"} ${classFor(iso)}`}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditTravelDatesModal({
  open,
  onOpenChange,
  startDate,
  endDate,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  startDate: string;
  endDate: string;
  onConfirm: (start: string, end: string) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = startDate ? new Date(startDate + "T00:00:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [draft, setDraft] = useState({ start: startDate, end: endDate });

  function handleDayClick(iso: string) {
    if (picking === "start") {
      setDraft({ start: iso, end: "" });
      setPicking("end");
    } else {
      setDraft(
        iso < draft.start
          ? { start: iso, end: draft.start }
          : { start: draft.start, end: iso }
      );
      setPicking("start");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setDraft({ start: startDate, end: endDate });
          setPicking("start");
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[720px] gap-0 p-0 sm:max-w-[720px]"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-dashed border-[#e5e7eb] px-6 py-4 text-left">
          <div>
            <DialogTitle className="text-[18px] font-bold leading-6 text-[#171717]">
              Edit Travel Dates
            </DialogTitle>
            <p className="mt-1 text-[13px] leading-4 text-[#525252]">
              It may affect changes in the pricing, extras and cancelation
              policies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        <div className="flex items-start gap-4 p-6">
          <button
            type="button"
            onClick={() => setViewMonth((m) => calAddMonths(m, -1))}
            className="mt-8 flex size-7 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] hover:bg-[#f3f4f6]"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4 text-[#525252]" />
          </button>
          <div className="grid flex-1 grid-cols-2 gap-6">
            <MonthGrid
              viewMonth={viewMonth}
              draft={draft}
              onDayClick={handleDayClick}
            />
            <MonthGrid
              viewMonth={calAddMonths(viewMonth, 1)}
              draft={draft}
              onDayClick={handleDayClick}
            />
          </div>
          <button
            type="button"
            onClick={() => setViewMonth((m) => calAddMonths(m, 1))}
            className="mt-8 flex size-7 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] hover:bg-[#f3f4f6]"
            aria-label="Next month"
          >
            <ChevronRight className="size-4 text-[#525252]" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!draft.start || !draft.end}
            onClick={() => onConfirm(draft.start, draft.end)}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditQuantityModal ───────────────────────────────────────────────────────

function EditQuantityModal({
  open,
  onOpenChange,
  quantity,
  minQuantity,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quantity: number;
  minQuantity: number;
  onConfirm: (qty: number) => void;
}) {
  const [draft, setDraft] = useState(quantity);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) setDraft(quantity);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] gap-0 p-0 sm:max-w-[420px]"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-dashed border-[#e5e7eb] px-6 py-4 text-left">
          <div>
            <DialogTitle className="text-[18px] font-bold leading-6 text-[#171717]">
              Edit Quantity
            </DialogTitle>
            <p className="mt-1 text-[13px] leading-4 text-[#525252]">
              Allowed Items: {minQuantity}+
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 p-6">
          <button
            type="button"
            disabled={draft <= minQuantity}
            onClick={() => setDraft((v) => Math.max(minQuantity, v - 1))}
            className="flex size-9 items-center justify-center rounded-md border border-[#e5e7eb] text-[#171717] hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-14 text-center text-[16px] font-semibold text-[#171717]">
            {draft}
          </span>
          <button
            type="button"
            onClick={() => setDraft((v) => v + 1)}
            className="flex size-9 items-center justify-center rounded-md border border-[#e5e7eb] text-[#171717] hover:bg-[#f3f4f6]"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onConfirm(draft)}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AddCustomExtraModal ─────────────────────────────────────────────────────

interface CustomExtraDraft {
  title: string;
  description: string;
  quantity: number;
  dateFrom: string;
  dateTo: string;
  adults: string;
  children: string;
  infants: string;
}

const EMPTY_CUSTOM_EXTRA: CustomExtraDraft = {
  title: "",
  description: "",
  quantity: 1,
  dateFrom: "",
  dateTo: "",
  adults: "",
  children: "",
  infants: "",
};

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Type here"}
      className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#171717] outline-none placeholder:text-[#a1a1a1] focus:border-[#931115] focus:ring-1 focus:ring-[#931115]/30"
    />
  );
}

function AddCustomExtraModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (draft: CustomExtraDraft) => void;
}) {
  const [draft, setDraft] = useState<CustomExtraDraft>(EMPTY_CUSTOM_EXTRA);
  const canConfirm = Boolean(draft.title && draft.dateFrom && draft.adults);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) setDraft(EMPTY_CUSTOM_EXTRA);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[600px] gap-0 p-0 sm:max-w-[600px]"
      >
        <DialogHeader className="flex-row items-start justify-between gap-10 border-b border-dashed border-[#e5e7eb] px-6 pb-4 pt-6 text-left">
          <div>
            <DialogTitle className="text-[18px] font-bold leading-7 tracking-[-0.4px] text-[#171717]">
              Add Custom Extra
            </DialogTitle>
            <p className="mt-0.5 text-[14px] font-medium leading-6 text-[#525252]">
              Add a custom Extra, that was approved by the Supplier
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <FieldLabel>
              Title <span className="text-[#f54a00]">*</span>
            </FieldLabel>
            <TextInput
              value={draft.title}
              onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Type here"
              className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-[14px] font-medium text-[#171717] outline-none placeholder:text-[#a1a1a1] focus:border-[#931115] focus:ring-1 focus:ring-[#931115]/30"
            />
          </div>

          <div className="flex items-start gap-4">
            <div>
              <FieldLabel>Quantity</FieldLabel>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={draft.quantity <= 1}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      quantity: Math.max(1, d.quantity - 1),
                    }))
                  }
                  className="flex size-8 items-center justify-center rounded-md bg-[#d1d5dc] text-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="flex h-8 w-10 items-center justify-center rounded-md border border-[#e5e7eb] text-[14px] font-semibold text-[#171717]">
                  {draft.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, quantity: d.quantity + 1 }))
                  }
                  className="flex size-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#171717] hover:bg-[#f3f4f6]"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <FieldLabel>
                Date From <span className="text-[#f54a00]">*</span>
              </FieldLabel>
              <DatePickerInput
                value={draft.dateFrom}
                onChange={(v) => setDraft((d) => ({ ...d, dateFrom: v }))}
              />
            </div>
            <div className="flex-1">
              <FieldLabel>Date To</FieldLabel>
              <DatePickerInput
                value={draft.dateTo}
                rangeStart={draft.dateFrom || undefined}
                onChange={(v) => setDraft((d) => ({ ...d, dateTo: v }))}
              />
            </div>
          </div>

          <DashedSeparator />

          <div className="flex items-start gap-3">
            <div className="flex-1">
              <FieldLabel>
                Adults (18+ y.o.) <span className="text-[#f54a00]">*</span>
              </FieldLabel>
              <TextInput
                value={draft.adults}
                onChange={(v) => setDraft((d) => ({ ...d, adults: v }))}
              />
            </div>
            <div className="flex-1">
              <FieldLabel>Children (2-17 y.o.)</FieldLabel>
              <TextInput
                value={draft.children}
                onChange={(v) => setDraft((d) => ({ ...d, children: v }))}
              />
            </div>
            <div className="flex-1">
              <FieldLabel>Infants (0-1 y.o.)</FieldLabel>
              <TextInput
                value={draft.infants}
                onChange={(v) => setDraft((d) => ({ ...d, infants: v }))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 bg-[#f9fafb] px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canConfirm}
            onClick={() => onConfirm(draft)}
          >
            Add Custom Extra
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AddExtraDetailModal ─────────────────────────────────────────────────────
// Opened from a catalog Extra's "Add"/"Add More" button. The pricing model
// (Unit vs Person) decides whether the guest picks a quantity or a guest subset.

const GUEST_TYPE_ROWS = [
  { key: "adults", label: "Adults" },
  { key: "youth", label: "Youth" },
  { key: "children", label: "Children" },
  { key: "infants", label: "Infants" },
] as const;

function AddExtraDetailModal({
  open,
  onOpenChange,
  extra,
  serviceName,
  supplierName,
  serviceStartDate,
  serviceEndDate,
  guestLimits,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  extra: CatalogExtra | null;
  serviceName: string;
  supplierName: string;
  serviceStartDate: string;
  serviceEndDate: string;
  guestLimits: ExtraGuestCounts;
  onConfirm: (result: {
    startDate: string;
    endDate: string;
    quantity?: number;
    guestCounts?: ExtraGuestCounts;
    totalPrice: number;
  }) => void;
}) {
  const [dateFrom, setDateFrom] = useState(serviceStartDate);
  const [dateTo, setDateTo] = useState(serviceEndDate);
  const [datesOpen, setDatesOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [guestCounts, setGuestCounts] = useState(guestLimits);
  const [editingGuests, setEditingGuests] = useState(false);

  if (!extra) return null;

  const isUnit = extra.chargeType === "Unit";
  const pricing = extra.pricing ?? { net: 0, sell: 0, rack: 0 };
  const totalGuests =
    guestCounts.adults +
    guestCounts.youth +
    guestCounts.children +
    guestCounts.infants;
  const totalUnits = isUnit ? quantity : Math.max(totalGuests, 0);
  const totalNet = pricing.net * totalUnits;
  const totalSell = pricing.sell * totalUnits;
  const totalRack = pricing.rack * totalUnits;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (v) {
            setDateFrom(serviceStartDate);
            setDateTo(serviceEndDate);
            setQuantity(1);
            setGuestCounts(guestLimits);
            setEditingGuests(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[680px] gap-0 p-0 sm:max-w-[680px]"
        >
          <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] px-6 pb-4 pt-6 text-left">
            <div>
              <div className="flex items-center gap-2">
                <ChevronLeft className="size-4 text-[#525252]" />
                <span className="text-[14px] font-medium text-[#2b7fff]">
                  {serviceName}
                </span>
                <span className="text-[14px] font-medium text-[#525252]">
                  {supplierName}
                </span>
              </div>
              <DialogTitle className="mt-0.5 text-[16px] font-bold text-[#171717]">
                {extra.title}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
            >
              <X className="size-5" />
            </button>
          </DialogHeader>

          <div className="flex flex-col gap-3 bg-white p-4">
            <div className="flex h-11 items-center justify-between rounded-md bg-background-tetriary px-4">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#171717]">
                Status
              </span>
              <span className="rounded-md border border-[#d1d5dc] bg-[#e5e7eb] px-1.5 py-0.5 text-[12px] font-medium text-[#525252]">
                New
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-bold text-[#171717]">
                    Travel Dates
                  </span>
                  <button
                    type="button"
                    onClick={() => setDatesOpen(true)}
                    className="text-[#931115] hover:opacity-70"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
                <span className="text-[14px] font-bold text-[#171717]">
                  {dateFrom ? formatDate(dateFrom) : "–"}
                  {dateTo ? ` - ${formatDate(dateTo)}` : ""}
                </span>
              </div>
              <DashedSeparator />

              {isUnit ? (
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[14px] font-bold text-[#171717]">
                    Quantity
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex size-8 items-center justify-center rounded-md bg-[#d1d5dc] text-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center rounded-md border border-[#e5e7eb] text-[14px] font-semibold text-[#171717]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex size-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#171717] hover:bg-[#f3f4f6]"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between py-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-bold text-[#171717]">
                      Added Guests
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingGuests((v) => !v)}
                      className="text-[#931115] hover:opacity-70"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <Info className="size-3.5 text-[#0369a1]" />
                  </div>
                  {editingGuests ? (
                    <div className="flex flex-col gap-1.5">
                      {GUEST_TYPE_ROWS.map(({ key, label }) => {
                        const max = guestLimits[key];
                        if (max <= 0) return null;
                        const value = guestCounts[key];
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-end gap-2"
                          >
                            <span className="text-[12px] font-medium text-[#525252]">
                              {label}
                            </span>
                            <button
                              type="button"
                              disabled={value <= 0}
                              onClick={() =>
                                setGuestCounts((g) => ({
                                  ...g,
                                  [key]: Math.max(0, g[key] - 1),
                                }))
                              }
                              className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] text-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-4 text-center text-[13px] font-semibold text-[#171717]">
                              {value}
                            </span>
                            <button
                              type="button"
                              disabled={value >= max}
                              onClick={() =>
                                setGuestCounts((g) => ({
                                  ...g,
                                  [key]: Math.min(max, g[key] + 1),
                                }))
                              }
                              className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] text-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-end gap-1">
                      {GUEST_TYPE_ROWS.filter(
                        ({ key }) => guestCounts[key] > 0
                      ).map(({ key, label }) => (
                        <span
                          key={key}
                          className="rounded bg-[#e5e7eb] px-1.5 py-1 text-[14px] font-semibold text-[#171717]"
                        >
                          {guestCounts[key]}{" "}
                          {guestCounts[key] === 1
                            ? label.replace(/s$/, "")
                            : label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <DashedSeparator />
            </div>

            <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-[#1f2937] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                <span>Type</span>
                <span>Charge Type</span>
                <span className="text-right">$, Net</span>
                <span className="text-right">$, Sell</span>
              </div>
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center border-t border-[#e5e7eb] px-3 py-2">
                <span className="text-[13px] font-medium text-[#171717]">
                  {isUnit ? "Unit" : "Person"}
                </span>
                <span className="text-[13px] font-semibold text-[#171717]">
                  {isUnit ? "PUPS" : "PPPN"}
                </span>
                <span className="text-right text-[13px] font-semibold text-[#171717]">
                  ${pricing.net}
                </span>
                <span className="text-right text-[13px] font-semibold text-[#171717]">
                  ${pricing.sell}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
              <div className="bg-[#1f2937] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Total
              </div>
              {(
                [
                  { label: "Rack", value: totalRack },
                  { label: "Net", value: totalNet },
                ] as const
              ).map(({ label, value }) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_auto] items-center border-t border-[#e5e7eb] px-3 py-2"
                >
                  <span className="text-[13px] text-[#525252]">{label}</span>
                  <span className="text-right text-[13px] font-semibold text-[#171717]">
                    ${value}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto] items-center border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
                <span className="text-[13px] font-bold text-[#171717]">
                  Client price
                </span>
                <span className="text-right text-[14px] font-bold text-[#171717]">
                  ${totalSell}
                </span>
              </div>
            </div>

            {extra.description && (
              <div>
                <p className="mb-1 text-[14px] font-semibold text-[#171717]">
                  Description
                </p>
                <div className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#171717]">
                  {extra.description}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 bg-[#f9fafb] px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() =>
                onConfirm({
                  startDate: dateFrom,
                  endDate: dateTo,
                  quantity: isUnit ? quantity : undefined,
                  guestCounts: isUnit ? undefined : guestCounts,
                  totalPrice: totalSell,
                })
              }
            >
              Add Extra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EditTravelDatesModal
        open={datesOpen}
        onOpenChange={setDatesOpen}
        startDate={dateFrom}
        endDate={dateTo}
        onConfirm={(start, end) => {
          setDateFrom(start);
          setDateTo(end);
          setDatesOpen(false);
        }}
      />
    </>
  );
}

// ─── EditDiscountModal ───────────────────────────────────────────────────────

function EditDiscountModal({
  open,
  onOpenChange,
  discount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  discount: number;
  onConfirm: (discount: number) => void;
}) {
  const [draft, setDraft] = useState(discount.toString());

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) setDraft(discount.toString());
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] gap-0 p-0 sm:max-w-[420px]"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-dashed border-[#e5e7eb] px-6 py-4 text-left">
          <div>
            <DialogTitle className="text-[18px] font-bold leading-6 text-[#171717]">
              Add Discount
            </DialogTitle>
            <p className="mt-1 text-[13px] leading-4 text-[#525252]">
              Applies as a flat reduction to the client price
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        <div className="p-6">
          <label className="mb-1 block text-[13px] font-semibold text-[#525252]">
            Discount amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#a1a1a1]">
              $
            </span>
            <input
              type="number"
              min={0}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white pl-6 pr-3 text-[14px] font-semibold text-[#171717] outline-none focus:border-[#931115] focus:ring-1 focus:ring-[#931115]/30"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onConfirm(Math.max(0, Number(draft) || 0))}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── DashedSeparator ─────────────────────────────────────────────────────────

function DashedSeparator() {
  return (
    <div className="h-px w-full border-t border-dashed border-[#e5e7eb]" />
  );
}

// ─── ExtraStatusBar ──────────────────────────────────────────────────────────
// Header strip on an Extra card: orange for Mandatory, gray "Added" once picked
// from the catalog. Optional + not-added extras render no bar at all.

function ExtraStatusBar({ isMandatory }: { isMandatory: boolean }) {
  if (!isMandatory) return null;
  return (
    <div className="w-full rounded-t-md bg-[#e5e7eb] px-3 py-1">
      <span className="block text-center text-[12px] font-bold text-[#525252]">
        Mandatory
      </span>
    </div>
  );
}

function extraChargeLabel(chargeType: "Person" | "Unit" | undefined): string {
  if (chargeType === "Unit") return "PUPS";
  if (chargeType === "Person") return "PPPN";
  return "";
}

// ─── Supplier dropdown ────────────────────────────────────────────────────────

function fmtClosureDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface SupplierRowProps {
  name: string;
  headOfficeName?: string;
  locationName?: string;
  isPreferred?: boolean;
  closedFrom?: string | null;
  closedTo?: string | null;
  isSelected: boolean;
  onSelect: () => void;
}

function SupplierRow({
  name,
  headOfficeName,
  locationName,
  isPreferred,
  closedFrom,
  closedTo,
  isSelected,
  onSelect,
}: SupplierRowProps) {
  const closedLabel = closedFrom
    ? `Closed: ${fmtClosureDate(closedFrom)}${closedTo ? ` - ${fmtClosureDate(closedTo)}` : ""}`
    : null;

  return (
    <div
      className="flex cursor-pointer items-stretch gap-0 border-b border-[#e5e7eb] bg-white hover:bg-gray-50"
      onMouseDown={onSelect}
    >
      {/* Add / selected indicator */}
      <div className="flex shrink-0 items-center border-r border-[#e5e7eb] px-3">
        {isSelected ? (
          <div className="flex size-7 items-center justify-center rounded-md bg-[#d1d5dc]">
            <Check className="size-4 text-[#171717]" />
          </div>
        ) : (
          <div className="flex size-7 items-center justify-center rounded-md border border-[#931115]">
            <Plus className="size-4 text-[#931115]" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 min-w-0 flex-col justify-center gap-0.5 py-2 pl-3 pr-3">
        {/* Top row: supplier name + star | head office */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[15px] font-bold leading-5 text-[#171717]">
              {name}
            </span>
            {isPreferred && (
              <Star className="size-3.5 shrink-0 fill-[#efb100] text-[#efb100]" />
            )}
          </div>
          {headOfficeName && (
            <span className="shrink-0 text-[13px] font-medium text-[#525252]">
              {headOfficeName}
            </span>
          )}
        </div>
        {/* Bottom row: location | closed badge */}
        <div className="flex items-center justify-between gap-2">
          {locationName ? (
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="size-3.5 shrink-0 text-[#525252]" />
              <span className="truncate text-[13px] font-medium text-[#525252]">
                {locationName}
              </span>
            </div>
          ) : (
            <span />
          )}
          {closedLabel && (
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-[#e5e7eb] px-2 py-0.5 text-[12px] font-medium text-[#525252]">
              <Info className="size-3 shrink-0" />
              {closedLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplierSelect({
  value,
  selectedName,
  onChange,
  error,
}: {
  value: string;
  selectedName?: string;
  onChange: (id: string, name: string) => void;
  error?: string;
}) {
  const { data: suppliers = [] } = useSuppliers();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => suppliers.filter((s) => s.isActive),
    [suppliers]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q
      ? active.filter((s) => s.name.toLowerCase().includes(q))
      : active;
    return [...list].sort(
      (a, b) => (b.preferredSupplier ? 1 : 0) - (a.preferredSupplier ? 1 : 0)
    );
  }, [active, query]);

  // Prefer the externally-provided name (e.g. set when a service auto-selects
  // its supplier) so the field stays consistent with what was chosen; fall back
  // to a lookup in the supplier list by id.
  const selectedLabel =
    selectedName || active.find((s) => s.id === value)?.name || "";

  const handleSelect = useCallback(
    (id: string, name: string) => {
      onChange(id, name);
      setQuery("");
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div className="relative flex flex-1 min-w-0 flex-col gap-0">
      <label className="pb-1 text-[14px] font-semibold leading-6 text-[#171717]">
        Supplier
      </label>
      {/* Input */}
      <div
        className={`flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 py-1 ${
          error
            ? "border-destructive"
            : open
              ? "border-[#931115] ring-1 ring-[#931115]/30"
              : "border-[#e5e7eb]"
        }`}
      >
        <Search className="size-4 shrink-0 text-[#a1a1a1]" />
        <input
          ref={inputRef}
          type="text"
          className="h-[26px] flex-1 bg-transparent text-[14px] font-medium text-[#171717] outline-none placeholder:text-[#a1a1a1]"
          placeholder={selectedLabel || "Search by Supplier"}
          value={open ? query : selectedLabel}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {value && !open && (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded text-[#a1a1a1] hover:text-[#525252]"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("", "");
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-72 overflow-y-auto rounded-md bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-center text-sm text-[#a1a1a1]">
              No suppliers found
            </p>
          ) : (
            filtered.map((s) => (
              <SupplierRow
                key={s.id}
                name={s.name}
                headOfficeName={s.headOfficeName}
                locationName={s.locationName}
                isPreferred={s.preferredSupplier}
                closedFrom={s.closedFrom}
                closedTo={s.closedTo}
                isSelected={s.id === value}
                onSelect={() => handleSelect(s.id, s.name)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Service search ───────────────────────────────────────────────────────────

interface ServiceOption {
  id: string;
  name: string;
  supplierName: string;
  priceFrom?: number;
  chargeType?: string;
  paxMin?: number;
  paxMax?: number;
  minNights?: number;
  minAge?: number;
  units?: string;
  specialAllocationRules?: boolean;
}

interface ServiceRowProps extends ServiceOption {
  isSelected: boolean;
  onSelect: () => void;
}

function ServiceRow({
  name,
  supplierName,
  priceFrom,
  chargeType,
  paxMin,
  paxMax,
  minNights,
  minAge,
  units,
  specialAllocationRules,
  onSelect,
}: ServiceRowProps) {
  const paxLabel =
    paxMin != null && paxMax != null && paxMin !== paxMax
      ? `${paxMin}-${paxMax}`
      : paxMin != null
        ? String(paxMin)
        : null;

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-start gap-2 border-b border-[#e5e7eb] bg-white px-3 py-2 text-left hover:bg-gray-50"
      onMouseDown={onSelect}
    >
      <div className="flex flex-1 min-w-0 flex-col gap-2">
        {/* Top row: name + price */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[16px] font-bold leading-6 text-[#171717]">
              {name}
            </span>
            <span className="truncate text-[14px] font-medium leading-[14px] text-[#525252]">
              {supplierName}
            </span>
          </div>
          {priceFrom != null && (
            <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
              <div className="flex items-end gap-1">
                <span className="text-[12px] font-medium leading-[13px] text-[#a1a1a1]">
                  from
                </span>
                <span className="text-[16px] font-bold leading-none text-[#171717]">
                  ${priceFrom.toFixed(2)}
                </span>
              </div>
              {chargeType && (
                <span className="text-[12px] font-medium leading-[13px] text-[#525252]">
                  {chargeType}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom row: metadata tags */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-[12px] font-semibold uppercase tracking-wide">
            {paxLabel && (
              <span>
                <span className="text-[#a1a1a1]">PAX: </span>
                <span className="text-[#171717]">{paxLabel}</span>
              </span>
            )}
            {units && (
              <span>
                <span className="text-[#a1a1a1]">Units: </span>
                <span className="text-[#171717]">{units}</span>
              </span>
            )}
            {minAge != null && (
              <span>
                <span className="text-[#a1a1a1]">Min Age: </span>
                <span className="text-[#171717]">{minAge}</span>
              </span>
            )}
            {minNights != null && (
              <span>
                <span className="text-[#a1a1a1]">Min Nights: </span>
                <span className="text-[#171717]">{minNights}</span>
              </span>
            )}
          </div>
          {specialAllocationRules && (
            <div className="flex h-[22px] items-center gap-1 rounded bg-[#d1d5dc] px-2 py-0.5">
              <CircleAlert className="size-3 text-[#171717]" />
              <span className="text-[12px] font-medium text-[#171717]">
                Special Allocation Rules
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ServiceSearch({
  supplierId,
  supplierNameOverride,
  value,
  selectedName,
  onChange,
  error,
}: {
  supplierId?: string | null;
  supplierNameOverride?: string;
  value: string;
  selectedName: string;
  onChange: (
    id: string,
    name: string,
    service: ServiceSearchResult | null
  ) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [] } = useServiceSearch(query, supplierId);

  return (
    <div className="relative flex flex-1 min-w-0 flex-col gap-0">
      <label className="pb-1 text-[14px] font-semibold leading-6 text-[#171717]">
        Service
      </label>
      <div
        className={`flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 py-1 ${
          error
            ? "border-destructive"
            : open
              ? "border-[#931115] ring-1 ring-[#931115]/30"
              : "border-[#e5e7eb]"
        }`}
      >
        <Search className="size-4 shrink-0 text-[#a1a1a1]" />
        <input
          ref={inputRef}
          type="text"
          className="h-[26px] flex-1 bg-transparent text-[14px] font-medium text-[#171717] outline-none placeholder:text-[#a1a1a1]"
          placeholder={selectedName || "Search by Service"}
          value={open ? query : (selectedName ?? "")}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onChange("", "", null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {value && !open && (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded text-[#a1a1a1] hover:text-[#525252]"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("", "", null);
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-72 overflow-y-auto rounded-md bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-center text-sm text-[#a1a1a1]">
              No services found
            </p>
          ) : (
            results.map((s) => (
              <ServiceRow
                key={s.id}
                id={s.id}
                name={s.name}
                supplierName={supplierNameOverride || s.supplierName}
                priceFrom={s.priceFrom}
                chargeType={s.chargeType}
                paxMin={s.paxMin}
                paxMax={s.paxMax}
                units={
                  s.unitsMin != null && s.unitsMax != null
                    ? s.unitsMin === s.unitsMax
                      ? String(s.unitsMin)
                      : `${s.unitsMin}-${s.unitsMax}`
                    : undefined
                }
                minNights={s.minNights ?? undefined}
                minAge={s.minAge}
                specialAllocationRules={s.specialAllocationRules}
                isSelected={s.id === value}
                onSelect={() => {
                  onChange(s.id, s.name, s);
                  setQuery("");
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="pb-1 text-[14px] font-semibold leading-6 text-[#171717]">
      {children}
    </p>
  );
}

// ─── PlainSelect ──────────────────────────────────────────────────────────────
// Same look & feel as DestinationTreeSelect, but a flat (non-tree) option list.

interface PlainSelectOption {
  value: string;
  label: string;
}

function PlainSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: PlainSelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`flex w-full items-center justify-between gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
          open
            ? "border-ring bg-white ring-1 ring-ring"
            : "border-input bg-white hover:bg-gray-50"
        }`}
      >
        <span
          className={`flex-1 truncate text-left ${selected ? "text-text-primary" : "text-text-tertiary"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex shrink-0 items-center text-text-tertiary">
          {open ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-input bg-white shadow-md">
          <div className="max-h-[240px] overflow-y-auto p-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
                    isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  onMouseDown={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1 text-text-primary">{opt.label}</span>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-[#8B1515]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itineraryId: string;
  travelDateFrom?: string;
  travelDateTo?: string | null;
}

interface FormState {
  supplierId: string;
  supplierName: string;
  serviceId: string;
  name: string;
  startDate: string;
  endDate: string;
  qty: number;
}

interface FieldErrors {
  supplierId?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

interface HoldRecord {
  id: string;
  price: string;
  date: Date;
  status: "Held" | "Released" | "Expired";
}

const HOLD_STATUS_ORDER: Record<HoldRecord["status"], number> = {
  Held: 0,
  Released: 1,
  Expired: 2,
};

function sortHolds(holds: HoldRecord[]): HoldRecord[] {
  return [...holds].sort((a, b) => {
    const statusDiff =
      HOLD_STATUS_ORDER[a.status] - HOLD_STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.date.getTime() - b.date.getTime();
  });
}

const MOCK_SUPPLIER_NOTES = `CHILD SHARING RATES
Child Sharing Notes:
Child aged 0 - 5.99 years sharing with 1 or 2 adults: FOC
 Child aged 6 - 16.99 years sharing with 1 or 2 adults: charged 50% of applicable adult rate as specified on the
 contract
----CIOR RATES
Children aged under 6 years are required to share with adult(s)
 Children aged 6 - 16.99 years in own room (maximum 3 children per room)
 - 1st child charged applicable adult rate as specified on the contract
 - 2nd & 3rd child charged 50% of the applicable adult rate as specified on the contrac
SUPPLIER PAYMENT TERMS
FIT
 25% non-refundable deposit due within 7 days of confirmation
 Balance of payment due 45 days prior to arrival
 (CPS Credit terms: invoice sent on the 15th of each month for all bookings travelled in the previous month)
 GROUPS
 30% non-refundable deposit due within 14 days of confirmation
 150 days prior to arrival additional 30% of total cost
 Balance of payment due 90 days prior to arrival
 ✓ CANCELLATION POLICY
 FIT
 From confirmation to 46 days prior to arrival: 25% deposit forfeited
 Between 45 days and arrival: 100% of total cost
 GROUPS
 From confirmation to 151 days prior to arrival: 30% deposit forfeited
 Between 150 to 91 days prior to arrival: 60% of total cost
 Between 90 days and arrival: 100% of total cost`;

const EMPTY_FORM: Omit<FormState, "startDate" | "endDate"> = {
  supplierId: "",
  supplierName: "",
  serviceId: "",
  name: "",
  qty: 1,
};

export function AddServiceModal({
  open,
  onOpenChange,
  itineraryId,
  travelDateFrom,
  travelDateTo,
}: AddServiceModalProps) {
  const { data: destinationTree = [] } = useDestinations();
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [destinationFromId, setDestinationFromId] = useState<string | null>(
    null
  );
  const [destinationToId, setDestinationToId] = useState<string | null>(null);
  const [selectedService, setSelectedService] =
    useState<ServiceSearchResult | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "guests" | "extras" | "promotions" | "supplier" | "notes"
  >("guests");
  const [option, setOption] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [extraDetail, setExtraDetail] = useState<SelectedExtra | null>(null);
  const [cancellationPolicyOpen, setCancellationPolicyOpen] = useState(false);
  const [editDatesOpen, setEditDatesOpen] = useState(false);
  const [editQtyOpen, setEditQtyOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [customExtraOpen, setCustomExtraOpen] = useState(false);
  const [extraAddTarget, setExtraAddTarget] = useState<CatalogExtra | null>(
    null
  );
  const [discount, setDiscount] = useState(0);
  const [includes, setIncludes] = useState("");
  const [excludes, setExcludes] = useState("");
  const [incExcExpanded, setIncExcExpanded] = useState(false);
  const [holds, setHolds] = useState<HoldRecord[]>([]);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [adults, setAdults] = useState(2);
  const [youth, setYouth] = useState(0);
  const [children, setChildren] = useState(1);
  const [infants, setInfants] = useState(0);
  const [, setChildrenAges] = useState<number[]>([17]);
  const [serviceLocation, setServiceLocation] = useState("Masai Mara");
  const [airstrip, setAirstrip] = useState("Keekorok Airstrip");
  const [checkIn, setCheckIn] = useState("10:00 AM");
  const [checkOut, setCheckOut] = useState("14:00 PM");

  const [serviceType, setServiceType] = useState<ServiceType>("ACCOMMODATION");
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    startDate: travelDateFrom ?? "",
    endDate: travelDateTo ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const { mutate: addService, isPending } = useAddItineraryService(itineraryId);
  const { data: catalogExtras = [] } = useSupplierExtras(
    form.supplierId || null
  );

  const activeHold = holds.find((h) => h.status === "Held");

  // BRD FR-ELIG-08: derived eligibility chip labels from service config
  const nightCount =
    form.startDate && form.endDate
      ? Math.round(
          (new Date(form.endDate).getTime() -
            new Date(form.startDate).getTime()) /
            86_400_000
        )
      : null;

  const nightsLabel = (() => {
    const min = selectedService?.minNights;
    if (min == null) return nightCount != null ? `Nights: ${nightCount}` : null;
    return `Nights: ${min}+`;
  })();

  const capacityLabel = (() => {
    const { paxMin, paxMax } = selectedService ?? {};
    if (paxMin != null && paxMax != null && paxMin !== paxMax)
      return `Capacity: ${paxMin}–${paxMax}`;
    if (paxMin != null && paxMax != null && paxMin === paxMax)
      return `Capacity: ${paxMin}`;
    if (paxMin != null) return `Capacity: ${paxMin}+`;
    if (paxMax != null) return `Capacity: up to ${paxMax}`;
    return null;
  })();

  const minAgeLabel =
    selectedService?.minAge != null
      ? `min age ${selectedService.minAge}`
      : null;

  const guestConstraintLabel = [capacityLabel, minAgeLabel]
    .filter(Boolean)
    .join(", ");

  const unitsLabel = (() => {
    const { unitsMin, unitsMax } = selectedService ?? {};
    if (unitsMin != null && unitsMax != null && unitsMin !== unitsMax)
      return `Allowed Items: ${unitsMin}–${unitsMax}`;
    if (unitsMin != null && unitsMax != null && unitsMin === unitsMax)
      return `Allowed Items: ${unitsMin}`;
    if (unitsMin != null) return `Allowed Items: ${unitsMin}+`;
    if (unitsMax != null) return `Allowed Items: up to ${unitsMax}`;
    return "Allowed Items: 1+";
  })();

  const handleTypeChange = (type: ServiceType) => {
    setServiceType(type);
    setErrors({});
  };

  const handleClose = () => {
    setForm({
      ...EMPTY_FORM,
      startDate: travelDateFrom ?? "",
      endDate: travelDateTo ?? "",
    });
    setErrors({});
    setServiceType("ACCOMMODATION");
    setDestinationId(null);
    setDestinationFromId(null);
    setDestinationToId(null);
    setSelectedService(null);
    setSearchExpanded(true);
    setActiveTab("guests");
    setOption("");
    setChildrenAges([17]);
    setServiceLocation("Masai Mara");
    setAirstrip("Keekorok Airstrip");
    setCheckIn("10:00 AM");
    setCheckOut("14:00 PM");
    setIncludes("");
    setExcludes("");
    setIncExcExpanded(false);
    setHolds([]);
    setAdults(2);
    setYouth(0);
    setChildren(1);
    setInfants(0);
    setSelectedExtras([]);
    setExtraDetail(null);
    onOpenChange(false);
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.name.trim()) errs.name = "Service is required";
    if (!form.startDate) errs.startDate = "Required";
    if (!form.endDate) errs.endDate = "Required";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = "Must be on or after start date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addService(
      {
        type: serviceType,
        supplierId: form.supplierId,
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        qty: form.qty,
        extras: selectedExtras.map((ex) => ({
          catalogExtraId: ex.catalogExtraId,
          title: ex.title,
          startDate: ex.startDate,
          endDate: ex.endDate,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Service added successfully");
          handleClose();
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Failed to add service"));
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90vh] max-w-[1066px] flex-col gap-0 overflow-visible p-0 sm:max-w-[1066px]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* ── Service type tabs + close (only shown when search is expanded) ── */}
            {searchExpanded && (
              <>
                <div className="shrink-0 rounded-tl-xl rounded-tr-xl bg-[#f9fafb] px-4 pb-3 pt-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-3">
                        {SERVICE_TYPE_CONFIG.filter(
                          (c) =>
                            !OTHERS_GROUP.has(c.value) || c.value === "OTHERS"
                        ).map((cfg) => {
                          const isActive =
                            cfg.value === "OTHERS"
                              ? OTHERS_GROUP.has(serviceType)
                              : serviceType === cfg.value;
                          return (
                            <button
                              key={cfg.value}
                              type="button"
                              onClick={() => {
                                if (cfg.value === "OTHERS") {
                                  if (!OTHERS_GROUP.has(serviceType)) {
                                    handleTypeChange("ACTIVITY");
                                  }
                                } else {
                                  handleTypeChange(cfg.value);
                                }
                              }}
                              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-[14px] font-semibold leading-6 text-[#171717] transition-colors ${
                                isActive
                                  ? "border-[#d1d5dc] bg-[#e5e7eb]"
                                  : "border-[#e5e7eb] bg-white"
                              }`}
                            >
                              <span
                                className="flex size-6 items-center justify-center rounded-md p-1"
                                style={{
                                  background: cfg.bg,
                                  border: `1px solid ${cfg.border}`,
                                  color: cfg.color,
                                }}
                              >
                                {cfg.icon}
                              </span>
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="ml-4 flex size-6 shrink-0 items-center justify-center text-[#171717] hover:opacity-70"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <DashedSeparator />

                {/* ── Search fields ──────────────────────────────────────── */}
                <div className="shrink-0 bg-white px-4 pb-4 pt-3">
                  <div className="flex gap-3">
                    <div className="w-[220px] shrink-0">
                      <FieldLabel>Start Date</FieldLabel>
                      <DatePickerInput
                        value={form.startDate}
                        onChange={(v) => {
                          setForm((f) => ({ ...f, startDate: v || "" }));
                          setErrors((e) => ({ ...e, startDate: undefined }));
                        }}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.startDate}
                        </p>
                      )}
                    </div>
                    <div className="w-[220px] shrink-0">
                      <FieldLabel>End Date</FieldLabel>
                      <DatePickerInput
                        value={form.endDate}
                        rangeStart={form.startDate || undefined}
                        onChange={(v) => {
                          setForm((f) => ({ ...f, endDate: v || "" }));
                          setErrors((e) => ({ ...e, endDate: undefined }));
                        }}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                    {serviceType === "FLIGHT" ? (
                      <div className="flex flex-1 gap-3">
                        <div className="flex-1">
                          <FieldLabel>Destination From</FieldLabel>
                          <DestinationTreeSelect
                            tree={destinationTree}
                            value={destinationFromId}
                            onValueChange={setDestinationFromId}
                            placeholder="Select Departure"
                          />
                        </div>
                        <div className="flex-1">
                          <FieldLabel>Destination To</FieldLabel>
                          <DestinationTreeSelect
                            tree={destinationTree}
                            value={destinationToId}
                            onValueChange={setDestinationToId}
                            placeholder="Select Arrival"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <FieldLabel>Destination</FieldLabel>
                        <DestinationTreeSelect
                          tree={destinationTree}
                          value={destinationId}
                          onValueChange={setDestinationId}
                          placeholder="Select Destination"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-3">
                    <DashedSeparator />
                  </div>

                  <div className="mt-3 flex gap-3">
                    <SupplierSelect
                      value={form.supplierId}
                      selectedName={form.supplierName}
                      onChange={(id, name) => {
                        setForm((f) => ({
                          ...f,
                          supplierId: id,
                          supplierName: name,
                          name: "",
                        }));
                        setErrors((e) => ({ ...e, supplierId: undefined }));
                      }}
                      error={errors.supplierId}
                    />
                    <ServiceSearch
                      supplierId={form.supplierId || null}
                      supplierNameOverride={form.supplierName || undefined}
                      value={form.serviceId}
                      selectedName={form.name}
                      onChange={(id, name, service) => {
                        setForm((f) => ({
                          ...f,
                          serviceId: id,
                          name,
                          supplierId: service?.supplierId ?? f.supplierId,
                          supplierName: service?.supplierName ?? f.supplierName,
                        }));
                        setSelectedService(service);
                        setOption("");
                        setIncludes("");
                        setExcludes("");
                        setErrors((e) => ({
                          ...e,
                          name: undefined,
                          supplierId: undefined,
                        }));
                        if (name) setSearchExpanded(false);
                      }}
                      error={errors.name}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Service header (shown when service selected + search collapsed) ── */}
            {!searchExpanded && form.name && (
              <div className="flex shrink-0 items-center justify-between rounded-tl-xl rounded-tr-xl border-b border-[#e5e7eb] bg-[#f9fafb] px-6 pb-3 pt-4">
                <div className="min-w-0">
                  {form.supplierName && (
                    <p className="text-[12px] text-[#525252]">
                      {form.supplierName}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[18px] font-bold text-[#171717]">
                      {form.name}
                    </span>
                    <Info className="size-4 shrink-0 text-[#0369a1]" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchExpanded(true)}
                    className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-[13px] font-medium text-[#525252] hover:bg-[#f3f4f6]"
                  >
                    Edit Search Request
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex size-7 items-center justify-center rounded-md text-[#525252] hover:bg-[#f3f4f6]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Body — only shown after a service is selected and search is collapsed ── */}
            {!searchExpanded && form.name && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[#e5e7eb]">
                {/* Full-width status row */}
                <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-[#f3f4f6] px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-[#171717]">
                      Status
                    </span>
                    <span className="rounded-md border border-[#d1d5dc] bg-[#e5e7eb] px-2 py-0.5 text-[12px] font-medium text-[#525252]">
                      New
                    </span>
                  </div>
                  {activeHold && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-[#00a6f4] bg-[#dff2fe] px-2 py-0.5 text-[12px] font-medium text-[#0084d1]">
                        Held
                      </span>
                      <div className="flex items-center gap-1 text-[14px] font-semibold text-[#171717]">
                        <Calendar className="size-4" />
                        {formatDate(activeHold.date)}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2-col equal split */}
                <div className="flex min-h-0 flex-1 divide-x divide-[#e5e7eb] overflow-hidden">
                  {/* ── LEFT PANEL: service details ─────────────────────────── */}
                  <div className="flex w-1/2 flex-col overflow-y-auto bg-white">
                    {/* Option + Cancellation Policy */}
                    <div className="border-b border-dashed border-[#e5e7eb] px-6 py-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-[#171717]">
                          Option
                        </span>
                        <button
                          type="button"
                          onClick={() => setCancellationPolicyOpen(true)}
                          className="flex items-center gap-1 text-[13px] font-medium text-[#0369a1] hover:underline"
                        >
                          <Info className="size-3.5" />
                          Cancellation Policy
                        </button>
                      </div>
                      <PlainSelect
                        value={option}
                        onValueChange={(v) => {
                          setOption(v);
                          const opt = selectedService?.options?.find(
                            (o) => o.id === v
                          );
                          setIncludes(opt?.includes ?? "");
                          setExcludes(opt?.excludes ?? "");
                        }}
                        placeholder="Select option…"
                        options={(selectedService?.options ?? []).map((o) => ({
                          value: o.id,
                          label: o.title,
                        }))}
                      />
                    </div>

                    {/* Travel Dates */}
                    <div className="border-b border-dashed border-[#e5e7eb] px-6 py-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-[14px] font-semibold text-[#171717]">
                              Travel Dates
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditDatesOpen(true)}
                              className="text-[#931115] hover:opacity-70"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                          {nightsLabel && (
                            <p className="text-[11px] text-[#a1a1a1]">
                              {nightsLabel}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-semibold text-[#171717]">
                            {form.startDate ? formatDate(form.startDate) : "–"}
                            {form.endDate
                              ? ` - ${formatDate(form.endDate)}`
                              : ""}
                          </span>
                          {nightCount != null && (
                            <p className="text-[11px] text-[#a1a1a1]">
                              ({nightCount}{" "}
                              {nightCount === 1 ? "Night" : "Nights"})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Added Guests */}
                    <div className="border-b border-dashed border-[#e5e7eb] px-6 py-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-[14px] font-semibold text-[#171717]">
                              Added Guests
                            </p>
                            <Info className="size-3.5 text-[#0369a1]" />
                          </div>
                          {guestConstraintLabel && (
                            <p className="text-[11px] text-[#a1a1a1]">
                              {guestConstraintLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {adults > 0 && (
                            <span className="rounded bg-[#e5e7eb] px-2 py-0.5 text-[12px] font-medium text-[#171717]">
                              {adults} Adults
                            </span>
                          )}
                          {youth > 0 && (
                            <span className="rounded bg-[#e5e7eb] px-2 py-0.5 text-[12px] font-medium text-[#171717]">
                              {youth} Youth
                            </span>
                          )}
                          {children > 0 && (
                            <span className="rounded bg-[#e5e7eb] px-2 py-0.5 text-[12px] font-medium text-[#171717]">
                              {children} Children
                            </span>
                          )}
                          {infants > 0 && (
                            <span className="rounded bg-[#e5e7eb] px-2 py-0.5 text-[12px] font-medium text-[#171717]">
                              {infants} Infants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="border-b border-dashed border-[#e5e7eb] px-6 py-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-[14px] font-semibold text-[#171717]">
                              Quantity
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditQtyOpen(true)}
                              className="text-[#931115] hover:opacity-70"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-[#a1a1a1]">
                            {unitsLabel}
                          </p>
                        </div>
                        <span className="text-[14px] font-semibold text-[#171717]">
                          {form.qty}
                        </span>
                      </div>
                    </div>

                    {/* Includes & Excludes (collapsible) */}
                    <div className="border-b border-dashed border-[#e5e7eb]">
                      <button
                        type="button"
                        onClick={() => setIncExcExpanded((v) => !v)}
                        className="flex w-full items-center justify-between px-6 py-2 text-[14px] font-semibold text-[#171717] hover:bg-[#f9fafb]"
                      >
                        Includes &amp; Excludes
                        <ChevronRight
                          className={`size-4 text-[#a1a1a1] transition-transform ${incExcExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                      {incExcExpanded && (
                        <div className="flex flex-col gap-3 px-6 pb-4">
                          <div>
                            <p className="mb-1 text-[13px] font-semibold text-[#525252]">
                              Includes
                            </p>
                            <textarea
                              rows={3}
                              value={includes}
                              onChange={(e) => setIncludes(e.target.value)}
                              className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#171717] outline-none focus:border-[#931115] focus:ring-1 focus:ring-[#931115]/30"
                              placeholder="What's included…"
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-[13px] font-semibold text-[#525252]">
                              Excludes
                            </p>
                            <textarea
                              rows={3}
                              value={excludes}
                              onChange={(e) => setExcludes(e.target.value)}
                              className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#171717] outline-none focus:border-[#931115] focus:ring-1 focus:ring-[#931115]/30"
                              placeholder="What's excluded…"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="border-b border-dashed border-[#e5e7eb] px-6 py-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[14px] font-semibold text-[#171717]">
                          Pricing
                        </p>
                        <button
                          type="button"
                          className="text-[13px] font-medium text-[#0369a1] hover:underline"
                        >
                          Override Prices
                        </button>
                      </div>

                      {/* Rate Card */}
                      <div className="mb-3 overflow-hidden rounded-md border border-[#e5e7eb]">
                        <div className="grid grid-cols-[40px_1fr_80px_70px_70px_28px] bg-[#1f2937] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                          <span>Q-TY</span>
                          <span>Type</span>
                          <span>Charge</span>
                          <span className="text-right">$, Net</span>
                          <span className="text-right">$, Rack</span>
                          <span />
                        </div>
                        {adults > 0 && (
                          <div className="grid grid-cols-[40px_1fr_80px_70px_70px_28px] items-center border-t border-[#e5e7eb] px-3 py-2">
                            <span className="text-[13px] font-semibold text-[#171717]">
                              {adults}
                            </span>
                            <span className="text-[13px] text-[#171717]">
                              Adult
                            </span>
                            <span className="text-[13px] text-[#171717]">
                              Night
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              300
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              390
                            </span>
                            <button
                              type="button"
                              className="flex justify-center text-[#931115] hover:opacity-70"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                        )}
                        {youth > 0 && (
                          <div className="grid grid-cols-[40px_1fr_80px_70px_70px_28px] items-center border-t border-[#e5e7eb] px-3 py-2">
                            <span className="text-[13px] font-semibold text-[#171717]">
                              {youth}
                            </span>
                            <span className="text-[13px] text-[#171717]">
                              Youth
                            </span>
                            <span className="text-[13px] text-[#171717]">
                              Night
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              150
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              195
                            </span>
                            <button
                              type="button"
                              className="flex justify-center text-[#931115] hover:opacity-70"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                        )}
                        {children > 0 && (
                          <div className="grid grid-cols-[40px_1fr_80px_70px_70px_28px] items-center border-t border-[#e5e7eb] px-3 py-2">
                            <span className="text-[13px] font-semibold text-[#171717]">
                              {children}
                            </span>
                            <span className="text-[13px] text-[#171717]">
                              Child
                            </span>
                            <span className="text-[13px] text-[#171717]">
                              Night
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              80
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              100
                            </span>
                            <button
                              type="button"
                              className="flex justify-center text-[#931115] hover:opacity-70"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* System Price */}
                      <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
                        <div className="bg-[#1f2937] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                          System Price
                        </div>
                        {(
                          [
                            { label: "Rack", value: "$3,364" },
                            { label: "Net", value: "$2,250" },
                            { label: "Sell", value: "--" },
                            { label: "Purchase price", value: "$2,250" },
                            { label: "CPS margin 30%", value: "$675" },
                            { label: "TC commission", value: "$0" },
                          ] as const
                        ).map(({ label, value }) => (
                          <div
                            key={label}
                            className="grid grid-cols-[1fr_auto_28px] items-center border-t border-[#e5e7eb] px-3 py-2"
                          >
                            <span className="text-[13px] text-[#525252]">
                              {label}
                            </span>
                            <span className="text-right text-[13px] font-semibold text-[#171717]">
                              {value}
                            </span>
                            <button
                              type="button"
                              className="flex justify-center text-[#8B1515] hover:opacity-70"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                        ))}
                        <div className="grid grid-cols-[1fr_auto_28px] items-center border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
                          <span className="text-[13px] font-bold text-[#171717]">
                            Client price
                          </span>
                          <span className="text-right text-[14px] font-bold text-[#171717]">
                            $3,263
                          </span>
                          <button
                            type="button"
                            className="flex justify-center text-[#8B1515] hover:opacity-70"
                          >
                            <Pencil className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Service Notes */}
                    <div className="px-6 py-4">
                      <p className="mb-2 text-[14px] font-semibold text-[#171717]">
                        Service Notes
                      </p>
                      <textarea
                        rows={4}
                        placeholder="Notes from supplier…"
                        className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#171717] placeholder:text-[#a1a1a1] focus:outline-none focus:ring-1 focus:ring-[#931115]"
                        value={selectedService?.notes ?? ""}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* ── RIGHT PANEL: tabs ─────────────────────────────────────── */}
                  <div className="flex w-1/2 flex-col overflow-hidden bg-white">
                    {/* Tab bar */}
                    <div className="shrink-0 border-b border-[#e5e7eb]">
                      <div className="flex gap-0 overflow-x-auto px-4">
                        {(
                          [
                            "guests",
                            "extras",
                            "promotions",
                            "supplier",
                            "notes",
                          ] as const
                        ).map((tab) => {
                          const baseLabel = {
                            guests: "Guests",
                            extras: "Extras",
                            promotions: "Promotions",
                            supplier: "Supplier",
                            notes: "Supplier Notes",
                          }[tab];
                          const label =
                            tab === "extras" && selectedExtras.length > 0 ? (
                              <>
                                {baseLabel}{" "}
                                <span className="ml-1 rounded bg-[#f3f4f6] px-1 text-[12px] font-semibold text-[#525252]">
                                  {selectedExtras.length}
                                </span>
                              </>
                            ) : (
                              baseLabel
                            );
                          return (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveTab(tab)}
                              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors ${
                                activeTab === tab
                                  ? "border-[#931115] text-[#931115]"
                                  : "border-transparent text-[#525252] hover:text-[#171717]"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tab content */}
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {/* Guests tab */}
                      {activeTab === "guests" && (
                        <div className="flex flex-col gap-0 bg-white px-4 py-4">
                          {/* CPS Guests */}
                          <div className="mb-4">
                            <p className="mb-3 text-[13px] font-semibold text-[#171717]">
                              CPS Guests
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              {(
                                [
                                  {
                                    label: "Adults (18+ y.o.)",
                                    value: adults,
                                    set: setAdults,
                                  },
                                  {
                                    label: "Children (2-17 y.o.)",
                                    value: children,
                                    set: setChildren,
                                  },
                                  {
                                    label: "Infants (0-1 y.o.)",
                                    value: infants,
                                    set: setInfants,
                                  },
                                ] as const
                              ).map(({ label, value, set }) => (
                                <div key={label}>
                                  <p className="mb-1 text-[11px] text-[#a1a1a1]">
                                    {label}
                                  </p>
                                  <input
                                    type="number"
                                    min={0}
                                    value={value}
                                    onChange={(e) =>
                                      set(Math.max(0, Number(e.target.value)))
                                    }
                                    className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] font-semibold text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#931115]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Supplier Occupancy Rules */}
                          <div className="mb-4">
                            <div className="mb-3 flex items-center gap-1">
                              <p className="text-[13px] font-semibold text-[#171717]">
                                Supplier Occupancy Rules
                              </p>
                              <Info className="size-3.5 text-[#0369a1]" />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-1 flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="mb-1 text-[11px] text-[#a1a1a1]">
                                      Adults (18+ y.o.)
                                    </p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={adults}
                                      onChange={(e) =>
                                        setAdults(
                                          Math.max(0, Number(e.target.value))
                                        )
                                      }
                                      className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] font-semibold text-[#a1a1a1] focus:outline-none"
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[11px] text-[#a1a1a1]">
                                      Youth (12-17 y.o.)
                                    </p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={youth}
                                      onChange={(e) =>
                                        setYouth(
                                          Math.max(0, Number(e.target.value))
                                        )
                                      }
                                      className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] font-semibold text-[#a1a1a1] focus:outline-none"
                                      readOnly
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="mb-1 text-[11px] text-[#a1a1a1]">
                                      Children (3-11 y.o.)
                                    </p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={children}
                                      className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] font-semibold text-[#a1a1a1] focus:outline-none"
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[11px] text-[#a1a1a1]">
                                      Infants (0-2 y.o.)
                                    </p>
                                    <input
                                      type="number"
                                      min={0}
                                      value={infants}
                                      className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] font-semibold text-[#a1a1a1] focus:outline-none"
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Guest Classification tooltip */}
                              <div className="w-[160px] shrink-0 rounded-md bg-[#e0f2fe] p-3">
                                <p className="mb-1.5 text-[12px] font-semibold text-[#0369a1]">
                                  Guest Classification
                                </p>
                                {[
                                  "Adult: 18+ years",
                                  "Youth: 12–17 years",
                                  "Child: 3–11 years",
                                  "Infant: Up to 2 years",
                                ].map((line) => (
                                  <p
                                    key={line}
                                    className="text-[11px] leading-5 text-[#0369a1]"
                                  >
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Assignment Rules — BRD AC9D: only show when Pax Composition is configured */}
                          {selectedService?.specialAllocationRules && (
                            <div className="mb-4">
                              <p className="mb-2 text-[13px] font-semibold text-[#a1a1a1]">
                                Assignment Rules
                              </p>
                              <textarea
                                rows={3}
                                readOnly
                                defaultValue={
                                  "Up to 3 adults per room\nUp to 2 children may share with adults\nChildren sharing with adults must be at least 5 years old"
                                }
                                className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#a1a1a1] focus:outline-none"
                              />
                            </div>
                          )}

                          {/* Logistics */}
                          <div>
                            <p className="mb-3 text-[13px] font-semibold text-[#171717]">
                              Logistics
                            </p>
                            <div className="flex flex-col gap-3">
                              <div>
                                <p className="mb-1 text-[13px] font-medium text-[#171717]">
                                  Service location
                                </p>
                                <select
                                  value={serviceLocation}
                                  onChange={(e) =>
                                    setServiceLocation(e.target.value)
                                  }
                                  className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#931115]"
                                >
                                  <option>Masai Mara</option>
                                  <option>Amboseli</option>
                                  <option>Serengeti</option>
                                </select>
                              </div>
                              <div>
                                <p className="mb-1 text-[13px] font-medium text-[#171717]">
                                  Airstrip
                                </p>
                                <select
                                  value={airstrip}
                                  onChange={(e) => setAirstrip(e.target.value)}
                                  className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#931115]"
                                >
                                  <option>Keekorok Airstrip</option>
                                  <option>Mara North Airstrip</option>
                                  <option>Ol Kiombo Airstrip</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="mb-1 text-[13px] font-medium text-[#171717]">
                                    Check-in
                                  </p>
                                  <input
                                    type="text"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                    className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#931115]"
                                  />
                                </div>
                                <div>
                                  <p className="mb-1 text-[13px] font-medium text-[#171717]">
                                    Check-out
                                  </p>
                                  <input
                                    type="text"
                                    value={checkOut}
                                    onChange={(e) =>
                                      setCheckOut(e.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#931115]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Extras tab */}
                      {activeTab === "extras" && (
                        <div className="flex flex-col gap-[17px] bg-white px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[14px] font-bold text-[#171717]">
                              Extras
                            </p>
                            <button
                              type="button"
                              onClick={() => setCustomExtraOpen(true)}
                              className="text-[13px] font-medium text-[#0369a1] hover:underline"
                            >
                              Add Custom Extra
                            </button>
                          </div>

                          {/* SELECTED */}
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#a1a1a1]">
                              Selected
                            </p>
                            {selectedExtras.length === 0 ? (
                              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#e5e7eb] py-6 text-center">
                                <p className="text-[12px] font-medium text-[#525252]">
                                  No extras added yet
                                </p>
                                <p className="mt-1 text-[11px] text-[#a1a1a1]">
                                  Add from the catalog below
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {selectedExtras.map((ex, idx) => {
                                  const counts = ex.guestCounts ?? {
                                    adults,
                                    youth,
                                    children,
                                    infants,
                                  };
                                  const paxParts = [
                                    counts.adults > 0
                                      ? `${counts.adults} Adult${counts.adults === 1 ? "" : "s"}`
                                      : "",
                                    counts.youth > 0
                                      ? `${counts.youth} Youth`
                                      : "",
                                    counts.children > 0
                                      ? `${counts.children} Child${counts.children === 1 ? "" : "ren"}`
                                      : "",
                                    counts.infants > 0
                                      ? `${counts.infants} Infant${counts.infants === 1 ? "" : "s"}`
                                      : "",
                                  ].filter(Boolean);
                                  return (
                                    <div
                                      key={ex.catalogExtraId + idx}
                                      className="flex flex-col items-start overflow-hidden rounded-md border border-[#e5e7eb] bg-white"
                                    >
                                      <ExtraStatusBar
                                        isMandatory={ex.isMandatory}
                                      />
                                      <div className="w-full px-3 py-1.5">
                                        <div className="flex h-7 w-full items-center justify-between">
                                          <button
                                            type="button"
                                            onClick={() => setExtraDetail(ex)}
                                            className="min-w-0 flex-1 truncate text-left text-[14px] font-bold text-[#2b7fff] hover:underline"
                                          >
                                            {ex.title}
                                          </button>
                                          <div className="flex shrink-0 items-center gap-3 border-l border-[#e5e7eb] pl-3">
                                            <div className="flex items-end gap-0.5">
                                              <span className="text-[14px] font-semibold text-[#171717]">
                                                {ex.totalPrice != null
                                                  ? `$${ex.totalPrice}`
                                                  : "$160"}
                                              </span>
                                              {ex.chargeType && (
                                                <span className="text-[12px] font-medium text-[#525252]">
                                                  {extraChargeLabel(
                                                    ex.chargeType
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setSelectedExtras((prev) =>
                                                  prev.filter(
                                                    (_, i) => i !== idx
                                                  )
                                                )
                                              }
                                              className="text-[#931115] hover:opacity-70"
                                            >
                                              <Trash2 className="size-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex w-full flex-col gap-1.5 border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[12px] text-[#525252]">
                                            Travel Dates
                                          </span>
                                          <span className="text-[12px] text-[#525252]">
                                            {ex.startDate
                                              ? ex.startDate === ex.endDate
                                                ? ex.startDate
                                                : `${ex.startDate} - ${ex.endDate}`
                                              : "Follows service dates"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[12px] text-[#525252]">
                                            Added Guests
                                          </span>
                                          <span className="text-[12px] text-[#525252]">
                                            {paxParts.length > 0
                                              ? paxParts.join(", ")
                                              : "No PAX"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[12px] text-[#525252]">
                                            Quantity
                                          </span>
                                          <span className="text-[12px] text-[#525252]">
                                            {ex.quantity ?? 1}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* CATALOG */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#a1a1a1]">
                                Catalog
                              </p>
                              {form.supplierName && (
                                <span className="rounded bg-[#e5e7eb] px-1.5 py-0.5 text-[10px] font-semibold text-[#525252]">
                                  {form.supplierName}
                                </span>
                              )}
                            </div>
                            {catalogExtras.length === 0 ? (
                              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#e5e7eb] py-8 text-center">
                                <p className="text-[12px] font-medium text-[#525252]">
                                  No catalog extras
                                </p>
                                <p className="mt-1 text-[11px] text-[#a1a1a1]">
                                  {form.supplierId
                                    ? "This supplier has no extras configured"
                                    : "Select a supplier first"}
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {catalogExtras
                                  .filter((e) => e.isActive)
                                  .map((catExtra) => {
                                    const alreadyAdded = selectedExtras.some(
                                      (s) => s.catalogExtraId === catExtra.id
                                    );
                                    return (
                                      <div
                                        key={catExtra.id}
                                        className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5"
                                      >
                                        <div className="flex h-7 w-full items-center justify-between">
                                          <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#171717]">
                                            {catExtra.title}
                                          </span>
                                          <div className="flex shrink-0 items-center gap-3 border-l border-[#e5e7eb] pl-3">
                                            <div className="flex items-end gap-0.5">
                                              <span className="text-[14px] font-semibold text-[#171717]">
                                                ${catExtra.pricing?.sell ?? 0}
                                              </span>
                                              <span className="text-[12px] font-medium text-[#525252]">
                                                {extraChargeLabel(
                                                  catExtra.chargeType
                                                )}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExtraAddTarget(catExtra)
                                              }
                                              className={`flex shrink-0 items-center justify-center gap-1 rounded-md border bg-white px-2 py-1 text-[12px] font-medium ${
                                                alreadyAdded
                                                  ? "border-[#e5e7eb] text-[#525252] hover:bg-[#f9fafb]"
                                                  : "border-[#931115] text-[#931115] hover:bg-[#fde8e8]"
                                              }`}
                                            >
                                              {alreadyAdded
                                                ? "Add More"
                                                : "Add"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Supplier tab */}
                      {activeTab === "supplier" && (
                        <div className="flex flex-col gap-3 bg-white px-4 py-4">
                          <p className="text-[14px] font-bold text-[#171717]">
                            Holds
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {sortHolds(holds).map((hold) => {
                              const isExpired = hold.status === "Expired";
                              const isReleased = hold.status === "Released";
                              const headerBg = isExpired
                                ? "bg-[#d1d5dc]"
                                : isReleased
                                  ? "bg-[#00a63e]"
                                  : "bg-[#00bcff]";
                              const headerText = isExpired
                                ? "text-[#525252]"
                                : "text-white";
                              const bodyBg = isExpired
                                ? "bg-[#f9fafb]"
                                : isReleased
                                  ? "bg-[#f0fdf4]"
                                  : "bg-[#dff2fe]";
                              const bodyBorder = isExpired
                                ? "border-[#d1d5dc]"
                                : isReleased
                                  ? "border-[#00a63e]"
                                  : "border-[#00a6f4]";
                              const bodyText = isExpired
                                ? "text-[#525252]"
                                : "text-[#171717]";
                              return (
                                <div key={hold.id} className="flex flex-col">
                                  <div
                                    className={`flex items-center gap-1 rounded-t-md px-3 py-1 ${headerBg}`}
                                  >
                                    {isExpired ? (
                                      <Clock
                                        className={`size-3 ${headerText}`}
                                      />
                                    ) : isReleased ? (
                                      <SquarePlus
                                        className={`size-3 ${headerText}`}
                                      />
                                    ) : (
                                      <CheckCheck
                                        className={`size-3 ${headerText}`}
                                      />
                                    )}
                                    <span
                                      className={`text-[14px] font-semibold ${headerText}`}
                                    >
                                      {hold.status}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex items-center justify-between rounded-b-md border border-t-0 p-1.5 ${bodyBg} ${bodyBorder}`}
                                  >
                                    <div className="flex flex-1 items-center gap-2">
                                      <span
                                        className={`flex-1 px-2 text-[14px] font-semibold ${bodyText}`}
                                      >
                                        {hold.price}
                                      </span>
                                      <span
                                        className={`flex-1 px-2 text-[14px] font-semibold ${bodyText}`}
                                      >
                                        {formatDate(hold.date)}
                                      </span>
                                    </div>
                                    <div className="flex w-[220px] shrink-0 items-center justify-end gap-2">
                                      {hold.status === "Held" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setHolds((prev) =>
                                              prev.map((h) =>
                                                h.id === hold.id
                                                  ? { ...h, status: "Released" }
                                                  : h
                                              )
                                            )
                                          }
                                          className="flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[12px] font-medium text-[#525252] hover:bg-gray-50"
                                        >
                                          <SquareArrowRight className="size-4" />
                                          Release
                                        </button>
                                      )}
                                      {!isExpired && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setHolds((prev) =>
                                              prev.map((h) =>
                                                h.id === hold.id
                                                  ? { ...h, status: "Expired" }
                                                  : h
                                              )
                                            )
                                          }
                                          className="flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[12px] font-medium text-[#525252] hover:bg-gray-50"
                                        >
                                          <SquareCheckBig className="size-4" />
                                          Mark Expired
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <DashedSeparator />
                          <button
                            type="button"
                            onClick={() => setHoldDialogOpen(true)}
                            className="flex h-9 items-center justify-center self-start rounded-md border border-[#931115] px-4 text-[14px] font-medium text-[#931115] hover:bg-[#fdf2f2]"
                          >
                            Add Hold
                          </button>
                        </div>
                      )}

                      {/* Supplier Notes tab */}
                      {activeTab === "notes" && (
                        <div className="flex flex-1 flex-col gap-3 bg-white px-4 py-4">
                          <p className="text-[14px] font-bold text-[#171717]">
                            Supplier Notes
                          </p>
                          <textarea
                            readOnly
                            rows={20}
                            value={MOCK_SUPPLIER_NOTES}
                            className="w-full flex-1 resize-y rounded-lg border-none bg-[#f3f4f6] px-4 py-3 text-[13px] leading-6 text-[#525252] outline-none"
                          />
                        </div>
                      )}

                      {/* Other tabs — placeholder */}
                      {activeTab !== "extras" &&
                        activeTab !== "guests" &&
                        activeTab !== "supplier" &&
                        activeTab !== "notes" && (
                          <div className="flex items-center justify-center py-12 text-sm text-[#a1a1a1]">
                            This section will be available after the service is
                            added.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer — only shown after service is selected ─────────── */}
            {form.name && (
              <div className="flex shrink-0 items-center justify-between rounded-b-[12px] border-t border-[#e5e7eb] bg-white px-6 py-3.5">
                <div className="flex items-center gap-6 rounded-[6px] bg-background-tetriary px-4 py-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a1a1a1]">
                      Supplier Net
                    </p>
                    <span className="text-[16px] font-bold tabular-nums text-[#171717]">
                      $2,250.00
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a1a1a1]">
                      Client Pays
                    </p>
                    <span className="text-[16px] font-bold tabular-nums text-[#171717]">
                      $3,263.00
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a1a1a1]">
                      Discount
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16px] font-bold tabular-nums text-[#171717]">
                        ${discount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDiscountOpen(true)}
                        className="flex size-7 items-center justify-center rounded-lg border border-[#931115] text-[#931115] hover:bg-[#fde8e8]"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    disabled={isPending}
                    className="gap-1.5"
                  >
                    <RefreshCw className="size-3.5" />
                    Update Price
                  </Button>
                  <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? "Adding…" : "Add Service"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <CancellationPolicyModal
        open={cancellationPolicyOpen}
        onOpenChange={setCancellationPolicyOpen}
        travelDateFrom={travelDateFrom}
        travelDateTo={travelDateTo}
      />

      <EditTravelDatesModal
        open={editDatesOpen}
        onOpenChange={setEditDatesOpen}
        startDate={form.startDate}
        endDate={form.endDate}
        onConfirm={(start, end) => {
          setForm((f) => ({ ...f, startDate: start, endDate: end }));
          setEditDatesOpen(false);
        }}
      />

      <EditDiscountModal
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        discount={discount}
        onConfirm={(value) => {
          setDiscount(value);
          setDiscountOpen(false);
        }}
      />

      <AddCustomExtraModal
        open={customExtraOpen}
        onOpenChange={setCustomExtraOpen}
        onConfirm={(draft) => {
          setSelectedExtras((prev) => [
            ...prev,
            {
              catalogExtraId: `custom-${Date.now()}`,
              title: draft.title,
              startDate: draft.dateFrom,
              endDate: draft.dateTo || draft.dateFrom,
              datesLocal: true,
              isMandatory: false,
            },
          ]);
          setCustomExtraOpen(false);
        }}
      />

      <AddExtraDetailModal
        open={Boolean(extraAddTarget)}
        onOpenChange={(v) => {
          if (!v) setExtraAddTarget(null);
        }}
        extra={extraAddTarget}
        serviceName={selectedService?.name ?? ""}
        supplierName={form.supplierName ?? ""}
        serviceStartDate={form.startDate}
        serviceEndDate={form.endDate}
        guestLimits={{ adults, youth, children, infants }}
        onConfirm={({
          startDate,
          endDate,
          quantity,
          guestCounts,
          totalPrice,
        }) => {
          if (!extraAddTarget) return;
          setSelectedExtras((prev) => [
            ...prev,
            {
              catalogExtraId: extraAddTarget.id,
              title: extraAddTarget.title,
              startDate,
              endDate,
              datesLocal: false,
              isMandatory: extraAddTarget.extraType === "Mandatory",
              quantity,
              guestCounts,
              totalPrice,
              chargeType: extraAddTarget.chargeType,
            },
          ]);
          setExtraAddTarget(null);
        }}
      />

      <EditQuantityModal
        open={editQtyOpen}
        onOpenChange={setEditQtyOpen}
        quantity={form.qty}
        minQuantity={selectedService?.unitsMin ?? 1}
        onConfirm={(qty) => {
          setForm((f) => ({ ...f, qty }));
          setEditQtyOpen(false);
        }}
      />

      <HoldServiceModal
        open={holdDialogOpen}
        onOpenChange={setHoldDialogOpen}
        onConfirm={(date) => {
          setHolds((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              price: "$3,263.00",
              date,
              status: "Held",
            },
          ]);
          setHoldDialogOpen(false);
        }}
      />

      {extraDetail && (
        <ExtraDetailModal
          open={Boolean(extraDetail)}
          onOpenChange={(o) => {
            if (!o) setExtraDetail(null);
          }}
          extra={extraDetail}
          serviceName={form.name}
          serviceStartDate={form.startDate}
          serviceEndDate={form.endDate}
          onSave={(updated) => {
            setSelectedExtras((prev) =>
              prev.map((e) =>
                e.catalogExtraId === updated.catalogExtraId ? updated : e
              )
            );
            setExtraDetail(null);
          }}
        />
      )}
    </>
  );
}
