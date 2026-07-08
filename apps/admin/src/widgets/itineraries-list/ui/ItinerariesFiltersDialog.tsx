import { Button } from "@sol/ui";
import { Filter, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useItineraries } from "@/entities/itinerary";
import { useAgencies } from "@/entities/agency";
import { useAgents } from "@/entities/agent";
import { useDestinations } from "@/entities/destination";
import { useDebouncedValue } from "@/shared/hooks";
import {
  AgencyTreeSelect,
  DatePickerInput,
  DestinationTreeSelect,
  DropdownSelect,
} from "@/shared/ui";

import type { ItinerariesDraftFilters } from "@/widgets/itineraries-list/model/types";

interface ItinerariesFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft: ItinerariesDraftFilters;
  onApply: (draft: ItinerariesDraftFilters) => void;
  activeFilterCount?: number;
}

const EMPTY_DRAFT: ItinerariesDraftFilters = {
  agencyId: null,
  agentId: null,
  dateFrom: null,
  dateTo: null,
  destinationId: null,
  createdOnFrom: null,
  createdOnTo: null,
  status: null,
  paymentStatus: null,
};

const STATUS_OPTIONS = [
  { value: "__all__", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PREPARED", label: "Prepared" },
  { value: "QUOTED", label: "Quoted" },
  { value: "APPROVED", label: "Approved" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "VOUCHERED", label: "Vouchered" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "TRAVEL_IN_PROGRESS", label: "Travel in Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "LOST", label: "Lost" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "SUPERSEDED", label: "Superseded" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "__all__", label: "All" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "DEPOSIT_PAID", label: "Deposit Paid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "FULLY_PAID", label: "Fully Paid" },
  { value: "OVERPAID", label: "Overpaid" },
  { value: "REFUND_PENDING", label: "Refund Pending" },
];

interface FilterFieldProps {
  label: string;
  value: string | null;
  onClear: () => void;
  children: ReactNode;
}

function FilterField({ label, value, onClear, children }: FilterFieldProps) {
  const { t } = useTranslation("admin");
  return (
    <div>
      <div className="flex items-center justify-between py-0.5">
        <p className="text-xs font-semibold leading-5 text-text-primary">
          {label}
        </p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs font-medium text-blue-500 opacity-80 no-underline hover:no-underline"
          disabled={!value}
          onClick={onClear}
        >
          {t("buttons.clear")}
        </Button>
      </div>
      {children}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
        {title}
      </p>
      {children}
    </div>
  );
}

function useLiveCount(draft: ItinerariesDraftFilters, enabled: boolean) {
  const debouncedDraft = useDebouncedValue(draft, 400);

  const queryInput = useMemo(
    () => ({
      agencyId: debouncedDraft.agencyId,
      bookedById: debouncedDraft.agentId,
      dateFrom: debouncedDraft.dateFrom,
      dateTo: debouncedDraft.dateTo,
      destinationId: debouncedDraft.destinationId,
      createdOnFrom: debouncedDraft.createdOnFrom,
      createdOnTo: debouncedDraft.createdOnTo,
      statuses: debouncedDraft.status ? [debouncedDraft.status] : null,
      paymentStatus: debouncedDraft.paymentStatus,
    }),
    [debouncedDraft]
  );

  const { data, isFetching } = useItineraries(queryInput);

  if (!enabled) return { count: null, isFetching: false };
  return { count: data?.total ?? null, isFetching };
}

export function ItinerariesFiltersDialog({
  open,
  onOpenChange,
  initialDraft,
  onApply,
  activeFilterCount = 0,
}: ItinerariesFiltersDialogProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { data: agencies = [] } = useAgencies();
  const { data: agents = [] } = useAgents();
  const { data: destinationTree = [] } = useDestinations();
  const [draft, setDraft] = useState<ItinerariesDraftFilters>(initialDraft);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(initialDraft);
    }
  }, [open, initialDraft]);

  const { count: liveCount, isFetching: isCountFetching } = useLiveCount(
    draft,
    open
  );

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft({ ...EMPTY_DRAFT });
  };

  return (
    <>
      {/* Trigger button */}
      <Button
        type="button"
        variant="outline-secondary"
        className="shrink-0 gap-2 bg-background hover:bg-muted/40"
        onClick={() => onOpenChange(!open)}
      >
        <Filter className="size-4" />
        {t("admin:buttons.filters")}
        {activeFilterCount > 0 && (
          <span className="ml-1 rounded-full bg-[#8B1515] px-1.5 py-0.5 text-xs text-white leading-none">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Fixed drawer — overlays the table, slides in from the right */}
      <div
        className={`fixed top-16 right-0 bottom-0 z-30 flex w-[550px] flex-col border-l border-border-tertiary bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-tertiary bg-gray-50 px-5 py-2.5">
          <h2 className="text-sm font-semibold text-text-primary">
            {t("admin:buttons.filters")}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 p-0 text-text-secondary hover:bg-gray-200"
            onClick={() => onOpenChange(false)}
            aria-label={t("common:buttons.close")}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Scrollable filter body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            <FilterSection title="Itinerary">
              <div className="grid grid-cols-2 gap-3">
                <FilterField
                  label={t("admin:itineraries.filters.status")}
                  value={draft.status}
                  onClear={() => setDraft((d) => ({ ...d, status: null }))}
                >
                  <DropdownSelect
                    value={draft.status ?? "__all__"}
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        status: v === "__all__" ? null : v,
                      }))
                    }
                    options={STATUS_OPTIONS}
                  />
                </FilterField>

                <FilterField
                  label={t("admin:itineraries.filters.paymentStatus")}
                  value={draft.paymentStatus}
                  onClear={() =>
                    setDraft((d) => ({ ...d, paymentStatus: null }))
                  }
                >
                  <DropdownSelect
                    value={draft.paymentStatus ?? "__all__"}
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        paymentStatus: v === "__all__" ? null : v,
                      }))
                    }
                    options={PAYMENT_STATUS_OPTIONS}
                  />
                </FilterField>
              </div>
            </FilterSection>

            <div className="border-t border-border-tertiary" />

            <FilterSection title="Parties">
              <div className="grid grid-cols-2 gap-3">
                <FilterField
                  label={t("admin:itineraries.filters.agency")}
                  value={draft.agencyId ?? draft.agentId}
                  onClear={() =>
                    setDraft((d) => ({ ...d, agencyId: null, agentId: null }))
                  }
                >
                  <AgencyTreeSelect
                    agencies={agencies}
                    agents={agents}
                    value={{ agencyId: draft.agencyId, agentId: draft.agentId }}
                    onSelect={({ agencyId, agentId }) =>
                      setDraft((d) => ({ ...d, agencyId, agentId }))
                    }
                    placeholder={t("admin:itineraries.filters.all")}
                  />
                </FilterField>

                <FilterField
                  label={t("admin:itineraries.filters.destination")}
                  value={draft.destinationId}
                  onClear={() =>
                    setDraft((d) => ({ ...d, destinationId: null }))
                  }
                >
                  <DestinationTreeSelect
                    tree={destinationTree}
                    value={draft.destinationId}
                    onValueChange={(id) =>
                      setDraft((d) => ({ ...d, destinationId: id }))
                    }
                    placeholder={t("admin:itineraries.filters.all")}
                  />
                </FilterField>
              </div>
            </FilterSection>

            <div className="border-t border-border-tertiary" />

            <FilterSection title="Dates">
              <div className="grid grid-cols-2 gap-3">
                <FilterField
                  label={t("admin:itineraries.filters.travelDateFrom")}
                  value={draft.dateFrom}
                  onClear={() => setDraft((d) => ({ ...d, dateFrom: null }))}
                >
                  <DatePickerInput
                    value={draft.dateFrom ?? ""}
                    onChange={(v) =>
                      setDraft((d) => ({ ...d, dateFrom: v || null }))
                    }
                  />
                </FilterField>
                <FilterField
                  label={t("admin:itineraries.filters.travelDateTo")}
                  value={draft.dateTo}
                  onClear={() => setDraft((d) => ({ ...d, dateTo: null }))}
                >
                  <DatePickerInput
                    value={draft.dateTo ?? ""}
                    onChange={(v) =>
                      setDraft((d) => ({ ...d, dateTo: v || null }))
                    }
                  />
                </FilterField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FilterField
                  label={t("admin:itineraries.filters.createdOnFrom")}
                  value={draft.createdOnFrom}
                  onClear={() =>
                    setDraft((d) => ({ ...d, createdOnFrom: null }))
                  }
                >
                  <DatePickerInput
                    value={draft.createdOnFrom ?? ""}
                    onChange={(v) =>
                      setDraft((d) => ({ ...d, createdOnFrom: v || null }))
                    }
                  />
                </FilterField>
                <FilterField
                  label={t("admin:itineraries.filters.createdOnTo")}
                  value={draft.createdOnTo}
                  onClear={() => setDraft((d) => ({ ...d, createdOnTo: null }))}
                >
                  <DatePickerInput
                    value={draft.createdOnTo ?? ""}
                    onChange={(v) =>
                      setDraft((d) => ({ ...d, createdOnTo: v || null }))
                    }
                  />
                </FilterField>
              </div>
            </FilterSection>
          </div>
        </div>

        {/* Footer: live count + actions */}
        <div className="shrink-0 border-t border-border-tertiary bg-gray-50 px-5 py-3">
          {liveCount !== null && (
            <p
              className={`mb-2.5 text-sm font-medium ${isCountFetching ? "text-text-tertiary" : "text-text-primary"}`}
            >
              → {isCountFetching ? "…" : liveCount} matching{" "}
              {liveCount === 1 ? "itinerary" : "itineraries"}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button type="button" variant="secondary" onClick={handleReset}>
              {t("admin:itineraries.filters.reset")}
            </Button>
            <Button type="button" variant="primary" onClick={handleApply}>
              {t("admin:itineraries.filters.applyButton")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
