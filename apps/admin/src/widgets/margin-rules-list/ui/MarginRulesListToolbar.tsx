import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sol/ui";
import { Search, X } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import type { DropdownSelectOption } from "@/shared/ui";

import type { MarginRulesFilterKey, MarginRulesFilters } from "../model/types";

import { MarginRulesFiltersPopover } from "./MarginRulesFiltersPopover";

interface MarginRulesListToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: Dispatch<SetStateAction<boolean>>;
  filters: MarginRulesFilters;
  onFilterChange: (key: MarginRulesFilterKey, value: string | null) => void;
  onApply: () => void;
  onReset: () => void;
  agencyGroupOptions: DropdownSelectOption[];
  serviceTypeOptions: DropdownSelectOption[];
  supplierOptions: DropdownSelectOption[];
  serviceOptions: DropdownSelectOption[];
  optionOptions: DropdownSelectOption[];
}

export function MarginRulesListToolbar({
  searchQuery,
  onSearchQueryChange,
  filtersOpen,
  onFiltersOpenChange,
  filters,
  onFilterChange,
  onApply,
  onReset,
  agencyGroupOptions,
  serviceTypeOptions,
  supplierOptions,
  serviceOptions,
  optionOptions,
}: MarginRulesListToolbarProps) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="mb-3 flex shrink-0 items-center gap-3">
      <InputGroup className="bg-white">
        <InputGroupAddon>
          <Search className="size-4 text-border-secondary" />
        </InputGroupAddon>
        <InputGroupInput
          value={searchQuery}
          placeholder={t("placeholders.searchMarginRules")}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="px-0"
        />
        {searchQuery.trim() ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={() => onSearchQueryChange("")}
              aria-label={t("buttons.clearSearch")}
            >
              <X className="size-3" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <MarginRulesFiltersPopover
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        filters={filters}
        onFilterChange={onFilterChange}
        onApply={onApply}
        onReset={onReset}
        agencyGroupOptions={agencyGroupOptions}
        serviceTypeOptions={serviceTypeOptions}
        supplierOptions={supplierOptions}
        serviceOptions={serviceOptions}
        optionOptions={optionOptions}
      />
    </div>
  );
}
