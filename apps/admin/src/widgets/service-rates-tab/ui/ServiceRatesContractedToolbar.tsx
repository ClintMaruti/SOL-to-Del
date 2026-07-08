import { cn } from "@sol/ui";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ServiceRate } from "@/entities/service-rate";
import type {
  ServiceRatesFilterChip,
  ServiceRatesFilterChipKey,
  ServiceRatesFilterState,
} from "@/features/filter-service-rates";
import type { ServiceOption } from "@/entities/supplier-service-options";

import { buildServiceRatesFilterChips } from "../lib/buildServiceRatesFilterChips";
import type { ServiceRatesFiltersDraft } from "../model/serviceRatesFiltersDraft";

import { ServiceRatesFiltersPopover } from "./ServiceRatesFiltersPopover";

const chipClassName =
  "inline-flex max-w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-foreground";

interface ServiceRatesContractedToolbarProps {
  matchingCount: number;
  filterState: ServiceRatesFilterState;
  options: ServiceOption[];
  rates: ServiceRate[];
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onApplyFilters: (draft: ServiceRatesFiltersDraft) => void;
  onRemoveFilter: (key: ServiceRatesFilterChipKey) => void;
  onClearAllFilters: () => void;
}

export function ServiceRatesContractedToolbar({
  matchingCount,
  filterState,
  options,
  rates,
  filtersOpen,
  onFiltersOpenChange,
  onApplyFilters,
  onRemoveFilter,
  onClearAllFilters,
}: ServiceRatesContractedToolbarProps) {
  const { t } = useTranslation("admin");

  const chips: ServiceRatesFilterChip[] = buildServiceRatesFilterChips({
    filterState,
    options,
    rates,
    t,
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[6px] border border-b border-border-tertiary bg-white px-4 py-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-foreground">
          <span className="font-semibold">{matchingCount}</span>{" "}
          {t("serviceRates.recordsLabel")}
        </span>

        {chips.map((chip) => (
          <div key={chip.key} className={chipClassName}>
            <span className="truncate font-semibold">{chip.label}</span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={t("buttons.clear")}
              onClick={() => onRemoveFilter(chip.key)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {chips.length > 0 ? (
          <button
            type="button"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-muted-foreground hover:text-foreground"
            )}
            aria-label={t("buttons.clearAll")}
            onClick={onClearAllFilters}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ServiceRatesFiltersPopover
          open={filtersOpen}
          onOpenChange={onFiltersOpenChange}
          filterState={filterState}
          options={options}
          rates={rates}
          onConfirm={(draft) => onApplyFilters(draft)}
        />
      </div>
    </div>
  );
}
