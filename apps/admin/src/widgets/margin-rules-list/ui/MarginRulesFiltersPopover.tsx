import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sol/ui";
import { Filter, X } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  DatePickerGridInput,
  DropdownSelect,
  type DropdownSelectOption,
} from "@/shared/ui";

import type { MarginRulesFilterKey, MarginRulesFilters } from "../model/types";

const ALL_FILTER_VALUE = "__all__";

interface MarginRulesFiltersPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

interface FilterFieldProps {
  label: string;
  value: string | null;
  onClear: () => void;
  children: ReactNode;
  disabled?: boolean;
}

function FilterField({
  label,
  value,
  onClear,
  children,
  disabled = false,
}: FilterFieldProps) {
  const { t } = useTranslation("admin");

  return (
    <div className={disabled ? "opacity-50" : undefined}>
      <div className="flex items-center justify-between px-0 py-1">
        <p className="text-sm font-semibold leading-6 text-text-primary">
          {label}
        </p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs font-medium text-blue-500 opacity-80 no-underline hover:no-underline"
          disabled={disabled || !value}
          onClick={onClear}
        >
          {t("buttons.clear")}
        </Button>
      </div>
      {children}
    </div>
  );
}

export function MarginRulesFiltersPopover({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApply,
  onReset,
  agencyGroupOptions,
  serviceTypeOptions,
  supplierOptions,
  serviceOptions,
  optionOptions,
}: MarginRulesFiltersPopoverProps) {
  const { t } = useTranslation(["admin", "common"]);

  const allLabel = t("labels.all");

  const selectOptions = useMemo(
    () => [{ value: ALL_FILTER_VALUE, label: allLabel }, ...agencyGroupOptions],
    [agencyGroupOptions, allLabel]
  );

  const selectWithAll = useMemo(
    () => ({
      serviceTypes: [
        { value: ALL_FILTER_VALUE, label: allLabel },
        ...serviceTypeOptions,
      ],
      suppliers: [
        { value: ALL_FILTER_VALUE, label: allLabel },
        ...supplierOptions,
      ],
      services: [
        { value: ALL_FILTER_VALUE, label: allLabel },
        ...serviceOptions,
      ],
      options: [{ value: ALL_FILTER_VALUE, label: allLabel }, ...optionOptions],
    }),
    [
      allLabel,
      optionOptions,
      serviceOptions,
      serviceTypeOptions,
      supplierOptions,
    ]
  );

  const handleSelectChange = (
    key: MarginRulesFilterKey,
    value: string | undefined
  ) => {
    onFilterChange(key, !value || value === ALL_FILTER_VALUE ? null : value);
  };

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <Button variant="outline-secondary" className="bg-white">
          <Filter className="size-4" />
          {t("buttons.filters")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="flex w-[360px] flex-col overflow-hidden border-border-tertiary p-0 shadow-md"
        style={{
          maxHeight:
            "min(calc(100dvh - 6rem), var(--radix-popover-content-available-height))",
        }}
      >
        <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
          <h2 className="text-sm font-medium leading-6 text-text-primary">
            {t("buttons.filters")}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-5 p-0 text-text-primary hover:bg-transparent"
            onClick={() => onOpenChange(false)}
            aria-label={t("common:buttons.close")}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
            <div className="flex flex-col gap-3">
              <FilterField
                label={t("labels.agencyGroup")}
                value={filters.agencyGroupId}
                onClear={() => onFilterChange("agencyGroupId", null)}
              >
                <DropdownSelect
                  value={filters.agencyGroupId ?? ALL_FILTER_VALUE}
                  options={selectOptions}
                  onValueChange={(value) =>
                    handleSelectChange("agencyGroupId", value)
                  }
                  isSearchable
                />
              </FilterField>

              <FilterField
                label={t("labels.serviceType")}
                value={filters.serviceTypeId}
                onClear={() => onFilterChange("serviceTypeId", null)}
              >
                <DropdownSelect
                  value={filters.serviceTypeId ?? ALL_FILTER_VALUE}
                  options={selectWithAll.serviceTypes}
                  onValueChange={(value) =>
                    handleSelectChange("serviceTypeId", value)
                  }
                  isSearchable
                />
              </FilterField>

              <FilterField
                label={t("labels.supplier")}
                value={filters.supplierId}
                onClear={() => onFilterChange("supplierId", null)}
              >
                <DropdownSelect
                  value={filters.supplierId ?? ALL_FILTER_VALUE}
                  options={selectWithAll.suppliers}
                  onValueChange={(value) =>
                    handleSelectChange("supplierId", value)
                  }
                  isSearchable
                />
              </FilterField>

              <FilterField
                label={t("labels.service")}
                value={filters.serviceId}
                onClear={() => onFilterChange("serviceId", null)}
                disabled={!filters.supplierId}
              >
                <DropdownSelect
                  value={filters.serviceId ?? ALL_FILTER_VALUE}
                  options={selectWithAll.services}
                  onValueChange={(value) =>
                    handleSelectChange("serviceId", value)
                  }
                  isSearchable
                  disabled={!filters.supplierId}
                />
              </FilterField>

              <FilterField
                label={t("labels.option")}
                value={filters.optionId}
                onClear={() => onFilterChange("optionId", null)}
                disabled={!filters.serviceId}
              >
                <DropdownSelect
                  value={filters.optionId ?? ALL_FILTER_VALUE}
                  options={selectWithAll.options}
                  onValueChange={(value) =>
                    handleSelectChange("optionId", value)
                  }
                  isSearchable
                  disabled={!filters.serviceId}
                />
              </FilterField>

              <div className="form-grid-compact gap-3">
                <FilterField
                  label={t("labels.validFrom")}
                  value={filters.validFrom}
                  onClear={() => onFilterChange("validFrom", null)}
                >
                  <DatePickerGridInput
                    value={filters.validFrom ?? undefined}
                    onChange={(value) => onFilterChange("validFrom", value)}
                  />
                </FilterField>
                <FilterField
                  label={t("labels.validTo")}
                  value={filters.validTo}
                  onClear={() => onFilterChange("validTo", null)}
                >
                  <DatePickerGridInput
                    value={filters.validTo ?? undefined}
                    onChange={(value) => onFilterChange("validTo", value)}
                  />
                </FilterField>
              </div>

              <FilterField
                label={t("labels.marginPercent")}
                value={filters.marginPercent || null}
                onClear={() => onFilterChange("marginPercent", null)}
              >
                <Input
                  value={filters.marginPercent}
                  placeholder={t("placeholders.typeMargin")}
                  onChange={(event) =>
                    onFilterChange("marginPercent", event.target.value)
                  }
                />
              </FilterField>
            </div>
          </div>

          <div className="shrink-0 border-t border-border-tertiary px-4 pb-4 pt-4">
            <div className="flex items-center justify-between">
              <Button type="button" variant="secondary" onClick={onReset}>
                {t("common:buttons.reset")}
              </Button>
              <Button type="button" variant="primary" onClick={handleApply}>
                {t("buttons.apply")}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
