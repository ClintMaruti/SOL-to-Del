import { Button } from "@sol/ui";
import { Calendar, ChevronDown, Info, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useItinerary } from "@/entities/itinerary";
import type { ItineraryDetail, ItineraryStatus } from "@/entities/itinerary";
import { AddServiceModal } from "@/features/add-itinerary-service";
import { ROUTES } from "@/shared/lib/paths";

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ItineraryStatus, string> = {
  DRAFT: "Draft",
  PREPARED: "Prepared",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  INVOICED: "Invoiced",
  VOUCHERED: "Vouchered",
  CONFIRMED: "Confirmed",
  TRAVEL_IN_PROGRESS: "Travel in Progress",
  COMPLETED: "Completed",
  LOST: "Lost",
  CANCELLED: "Cancelled",
  SUPERSEDED: "Superseded",
};

// Status indicator dot colour (shown next to the uppercase status label).
const STATUS_DOT_COLORS: Record<ItineraryStatus, string> = {
  DRAFT: "bg-gray-400",
  PREPARED: "bg-blue-500",
  QUOTED: "bg-indigo-500",
  APPROVED: "bg-emerald-500",
  INVOICED: "bg-teal-500",
  VOUCHERED: "bg-cyan-500",
  CONFIRMED: "bg-green-500",
  TRAVEL_IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-gray-400",
  LOST: "bg-red-500",
  CANCELLED: "bg-red-600",
  SUPERSEDED: "bg-gray-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPax(detail: ItineraryDetail): string {
  const total = detail.adultsCount + detail.childrenCount + detail.infantsCount;
  const parts: string[] = [];
  if (detail.adultsCount) parts.push(`${detail.adultsCount}A`);
  if (detail.childrenCount) parts.push(`${detail.childrenCount}C`);
  if (detail.infantsCount) parts.push(`${detail.infantsCount}I`);
  const ages =
    detail.childrenAges.length > 0 ? ` / ${detail.childrenAges.join(",")}` : "";
  return `${total} ${total === 1 ? "Guest" : "Guests"} (${parts.join(", ")}${ages})`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap">
      <span className="text-xs font-semibold uppercase leading-5 text-text-tertiary">
        {label}
      </span>
      {value ? (
        <span className="max-w-[220px] truncate text-sm font-semibold leading-6 text-text-primary underline decoration-from-font [text-underline-position:from-font]">
          {value}
        </span>
      ) : (
        <span className="text-sm font-semibold leading-6 text-text-tertiary">
          Not assigned
        </span>
      )}
    </div>
  );
}

const TABS = [
  "Itinerary",
  "Changes",
  "Guests Details",
  "Documents",
  "Finance",
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ItineraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const { data, isLoading, isError } = useItinerary(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8B1515] border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <p className="text-sm text-text-tertiary">Itinerary not found.</p>
      </div>
    );
  }

  const leadName =
    data.leadTravelerFirstName || data.leadTravelerLastName
      ? [data.leadTravelerFirstName, data.leadTravelerLastName]
          .filter(Boolean)
          .join(" ")
      : null;

  const agentDisplay = data.agentName ?? data.agencyName;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* ── Breadcrumb + Tabs ─────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center border-b border-border-tertiary bg-white px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 py-3 text-sm text-text-tertiary">
          <button
            type="button"
            className="hover:text-text-primary transition-colors"
            onClick={() => navigate(ROUTES.ITINERARY_ITINERARIES_LIST)}
          >
            Itineraries
          </button>
          <span>/</span>
          <span className="font-medium text-text-primary">
            {data.reference}
          </span>
        </nav>

        {/* Tabs */}
        <div className="ml-6 flex items-end gap-0.5">
          {TABS.map((tab) => {
            const isActive = tab === "Itinerary";
            return (
              <button
                key={tab}
                type="button"
                disabled={!isActive}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-[#8B1515] text-[#8B1515]"
                    : "text-text-tertiary cursor-default"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Details bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border-tertiary bg-white py-3 pl-4 pr-6">
        <div className="flex items-center justify-between gap-5">
          {/* Left: ID + status column, then the meta fields */}
          <div className="flex min-w-0 items-center gap-5">
            {/* ID + status (stacked) */}
            <div className="flex min-w-[120px] shrink-0 flex-col gap-2">
              <div className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold leading-[14px]">
                <span className="text-text-tertiary">ID:</span>
                <span className="text-text-primary">{data.reference}</span>
              </div>
              <button
                type="button"
                className="flex cursor-default items-center gap-0.5"
              >
                <ChevronDown className="size-3 text-text-primary" />
                <span className="flex items-center gap-1">
                  <span className="text-sm font-bold uppercase leading-[14px] tracking-[0.2px] text-text-primary">
                    {STATUS_LABELS[data.status]}
                  </span>
                  <span
                    className={`size-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[data.status]}`}
                  />
                </span>
              </button>
            </div>

            {/* Meta fields */}
            <div className="flex min-w-0 items-center gap-6 overflow-x-auto">
              <MetaField label="Title" value={data.title} />
              <MetaField label="Lead Traveler" value={leadName} />
              <MetaField label="Sales Support" value={data.salesSupportName} />
              <MetaField
                label="Safari Planner"
                value={data.safariPlannerName}
              />
              <MetaField label="Agent" value={agentDisplay} />
              <MetaField label="OPS" value={data.opsName} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-3 text-xs"
              onClick={() => navigate(ROUTES.ITINERARY_ITINERARIES_LIST)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="h-8 gap-1 py-2 pl-3 pr-1 text-xs"
            >
              Actions
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Request bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border-tertiary bg-white px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Calendar className="size-4 text-text-tertiary" />
            {formatDate(data.travelDateFrom)}
            {data.travelDateTo && <> — {formatDate(data.travelDateTo)}</>}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Users className="size-4 text-text-tertiary" />
            {formatPax(data)}
          </span>
          <div className="ml-auto">
            <Button
              type="button"
              variant="primary"
              className="h-7 gap-1.5 px-3 text-xs"
              onClick={() => setAddServiceOpen(true)}
            >
              <Plus className="size-3.5" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      {/* ── Services table ────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Table header */}
        <div className="grid shrink-0 grid-cols-[1fr_56px_72px_140px_110px_100px_100px_40px] border-b border-border-tertiary bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          <span>Supplier / Service</span>
          <span className="text-center">Qty</span>
          <span className="text-center">Nights</span>
          <span>Dates</span>
          <span>Allocation</span>
          <span>Status</span>
          <span className="text-right">Subtotal</span>
          <span />
        </div>

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-50">
            <Info className="size-5 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">
              No Services yet
            </p>
            <p className="mt-1 text-sm text-text-tertiary">
              All Services will appear here once they are added.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="mt-1 gap-1.5"
            onClick={() => setAddServiceOpen(true)}
          >
            <Plus className="size-4" />
            Add Service
          </Button>
        </div>
      </div>

      {id && (
        <AddServiceModal
          open={addServiceOpen}
          onOpenChange={setAddServiceOpen}
          itineraryId={id}
          travelDateFrom={data.travelDateFrom}
          travelDateTo={data.travelDateTo}
        />
      )}
    </div>
  );
}
