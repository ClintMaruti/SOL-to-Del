import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  cn,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sol/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  ItineraryListItem,
  ItinerarySortField,
} from "@/entities/itinerary";
import { useItineraries } from "@/entities/itinerary";
import { useAgencies } from "@/entities/agency";
import { useDestinations } from "@/entities/destination";
import {
  EmptySearchResult,
  SearchInput,
  SortableHeader,
  TableLoadingSkeleton,
} from "@/shared/ui";

import { buildItinerariesFilterChips } from "../model/itinerariesList.utils";
import { useItinerariesListUrlQuery } from "../model/useItinerariesListUrlQuery";
import { useVisibleItinerariesFilterChips } from "../model/useVisibleItinerariesFilterChips";

import { ItinerariesFiltersDialog } from "./ItinerariesFiltersDialog";
import { ItinerariesListEmpty } from "./ItinerariesListEmpty";
import { ItinerariesListFiltersBar } from "./ItinerariesListFiltersBar";
import { ItinerariesListRow } from "./ItinerariesListRow";

interface ItinerariesListProps {
  onCreate: () => void;
  onCopy?: (item: ItineraryListItem) => void;
}

function DisabledSortHeader({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-2 cursor-default select-none text-sm font-medium text-text-secondary">
          {label}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-40"
          >
            <path
              d="M2 5.33341L4.66667 2.66675M4.66667 2.66675L7.33333 5.33341M4.66667 2.66675V13.3334"
              stroke="#99A1AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 10.6667L11.3333 13.3334M11.3333 13.3334L8.66667 10.6667M11.3333 13.3334V2.66675"
              stroke="#99A1AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Sorting by this column is not available.
      </TooltipContent>
    </Tooltip>
  );
}

export function ItinerariesList({ onCreate, onCopy }: ItinerariesListProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHiddenChips, setShowHiddenChips] = useState(false);
  const prevErrorRef = useRef(false);

  const {
    searchInput,
    setSearchInput,
    queryInput,
    toggleSort,
    removeFilterKey,
    applyDraftFilters,
    clearAllFilters,
    draftFromUrl,
  } = useItinerariesListUrlQuery();

  const { data, isLoading, isError, error, isFetching, refetch } =
    useItineraries(queryInput);
  const { data: agencies = [] } = useAgencies();
  const { data: destinationTree = [] } = useDestinations();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const appliedFilterChips = useMemo(() => {
    const agencyMap = new Map(agencies.map((a) => [a.id, a.name]));
    const flattenDestinations = (
      nodes: typeof destinationTree
    ): Map<string, string> => {
      const map = new Map<string, string>();
      const walk = (list: typeof destinationTree) => {
        for (const n of list) {
          map.set(n.id, n.name);
          if (n.children?.length) walk(n.children);
        }
      };
      walk(nodes);
      return map;
    };
    const destMap = flattenDestinations(destinationTree);

    const statusLabelMap: Record<string, string> = {
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
    const paymentLabelMap: Record<string, string> = {
      UNPAID: "Unpaid",
      DEPOSIT_PAID: "Deposit Paid",
      PARTIALLY_PAID: "Partially Paid",
      FULLY_PAID: "Fully Paid",
      OVERPAID: "Overpaid",
      REFUND_PENDING: "Refund Pending",
    };

    return buildItinerariesFilterChips({
      agencyId: queryInput.agencyId ?? null,
      bookedById: queryInput.bookedById ?? null,
      dateFrom: queryInput.dateFrom ?? null,
      dateTo: queryInput.dateTo ?? null,
      destinationId: queryInput.destinationId ?? null,
      createdOnFrom: queryInput.createdOnFrom ?? null,
      createdOnTo: queryInput.createdOnTo ?? null,
      status: queryInput.statuses?.[0] ?? null,
      paymentStatus: queryInput.paymentStatus ?? null,
      agencyLabel: (id) => agencyMap.get(id),
      bookedByLabel: () => undefined,
      destinationLabel: (id) => destMap.get(id),
      statusLabel: (v) => statusLabelMap[v] ?? v,
      paymentStatusLabel: (v) => paymentLabelMap[v] ?? v,
      t,
    });
  }, [agencies, destinationTree, queryInput, t]);

  const activeFilterCount = appliedFilterChips.length;

  const {
    firstLineRef,
    countRef,
    dotMeasureRef,
    setChipMeasureRef,
    visibleChips,
    hiddenChips,
  } = useVisibleItinerariesFilterChips(appliedFilterChips);

  useEffect(() => {
    if (isError && !prevErrorRef.current) {
      toast.error(
        getErrorMessage(error, t("admin:itineraries.errors.loadFailed"))
      );
    }
    prevErrorRef.current = isError;
  }, [isError, error, t]);

  const sortField = queryInput.sort ?? null;
  const sortDirection = queryInput.order ?? "desc";

  const handleSort = useCallback(
    (field: ItinerarySortField) => toggleSort(field),
    [toggleSort]
  );

  const canRender = !isLoading && !isError;
  const hasQueryOrFilters =
    (queryInput.search?.trim().length ?? 0) > 0 || activeFilterCount > 0;
  const showEmptySearch = canRender && total === 0 && hasQueryOrFilters;
  const showEmpty = canRender && total === 0 && !hasQueryOrFilters;
  const showTable = canRender && total > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-[16px] flex w-full gap-2">
        <div className="flex-1">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by Reference, Agency / Agent name or Lead Traveler name"
          />
        </div>
        <ItinerariesFiltersDialog
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          initialDraft={draftFromUrl}
          onApply={applyDraftFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border-tertiary bg-background">
        <ItinerariesListFiltersBar
          totalCount={total}
          visibleChips={visibleChips}
          hiddenChips={hiddenChips}
          appliedFilterChips={appliedFilterChips}
          showHiddenChips={showHiddenChips}
          onToggleHiddenChips={() => setShowHiddenChips((v) => !v)}
          onRemoveFilter={removeFilterKey}
          onClearAll={() => {
            clearAllFilters();
            setShowHiddenChips(false);
          }}
          firstLineRef={firstLineRef}
          countRef={countRef}
          dotMeasureRef={dotMeasureRef}
          setChipMeasureRef={setChipMeasureRef}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading && (
            <div className="flex min-h-0 flex-1 flex-col">
              <TableLoadingSkeleton
                columns={[
                  "10",
                  "14",
                  "12",
                  "9",
                  "11",
                  "8",
                  "8",
                  "7",
                  "7",
                  "8",
                  "6",
                ]}
                rows={10}
              />
            </div>
          )}

          {isError && (
            <div className="border-t border-border-tertiary px-4 py-6 text-destructive">
              {getErrorMessage(error, t("admin:itineraries.errors.loadFailed"))}
              <Button
                type="button"
                variant="link"
                className="ml-2 h-auto p-0"
                onClick={() => void refetch()}
              >
                {t("admin:buttons.retry")}
              </Button>
            </div>
          )}

          {showEmptySearch && (
            <div className="flex min-h-0 flex-1 flex-col border-t border-border-tertiary">
              <EmptySearchResult />
            </div>
          )}

          {showEmpty && (
            <div className="flex min-h-0 flex-1 flex-col justify-center border-t border-border-tertiary p-6">
              <ItinerariesListEmpty onCreate={onCreate} />
            </div>
          )}

          {showTable && (
            <div
              className={cn(
                "min-h-0 flex-1 overflow-auto border-t border-border-tertiary",
                isFetching && "opacity-70"
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[10%] border-r pl-4 pr-2">
                      <SortableHeader<ItinerarySortField>
                        label="Inquiry"
                        field="reference"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[14%] border-r">
                      <SortableHeader<ItinerarySortField>
                        label="Title"
                        field="title"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[12%] border-r px-2">
                      <DisabledSortHeader label="Agency / Agent" />
                    </TableHead>
                    <TableHead className="w-[9%] border-r px-2">
                      <DisabledSortHeader label="Safari Planner" />
                    </TableHead>
                    <TableHead className="w-[11%] border-r">
                      <SortableHeader<ItinerarySortField>
                        label="Travel Dates"
                        field="travelDateFrom"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[8%] border-r">
                      <SortableHeader<ItinerarySortField>
                        label="Status"
                        field="status"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[8%] border-r">
                      <SortableHeader<ItinerarySortField>
                        label="Payment"
                        field="paymentStatus"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[7%] border-r text-right pr-2">
                      <SortableHeader<ItinerarySortField>
                        label="Total"
                        field="total"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[7%] border-r text-right pr-2">
                      <SortableHeader<ItinerarySortField>
                        label="Balance"
                        field="balance"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[8%] border-r">
                      <SortableHeader<ItinerarySortField>
                        label="Last Updated"
                        field="updatedAt"
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[6%] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, index) => (
                    <ItinerariesListRow
                      key={row.id}
                      item={row}
                      isLast={index === items.length - 1}
                      onCopy={onCopy}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
