import { useMemo, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { useAgencyGroups } from "@/entities/agency-group";
import { useMarginRulesList, type MarginRule } from "@/entities/margin-rule";
import { useServiceTypes } from "@/entities/service-type";
import { useSupplierServices } from "@/entities/supplier-services";
import { useSuppliers } from "@/entities/suppliers";
import {
  getServiceOptionLabel,
  getSupplierServiceLabel,
  matchesSelectedServiceType,
} from "@/shared/lib/catalog-service.utils";
import type { DropdownSelectOption } from "@/shared/ui";

import {
  byLabelAsc,
  createAppliedFilterChips,
  createChipLabelMap,
  toDropdownOption,
} from "../model/marginRulesList.utils";
import type { MarginRulesFilterChip } from "../model/types";
import { useMarginRulesListControls } from "../model/useMarginRulesListControls";
import { useVisibleMarginRulesFilterChips } from "../model/useVisibleMarginRulesFilterChips";

import { MarginRulesListContent } from "./MarginRulesListContent";
import { MarginRulesListFiltersBar } from "./MarginRulesListFiltersBar";
import { MarginRulesListToolbar } from "./MarginRulesListToolbar";

interface MarginRulesListProps {
  onCreateAction: (event: MouseEvent<HTMLButtonElement>) => void;
  onDuplicateRule: (rule: MarginRule) => void;
  onEditRule: (rule: MarginRule) => void;
  onDeleteRule: (rule: MarginRule) => void;
}

export function MarginRulesList({
  onCreateAction,
  onDuplicateRule,
  onEditRule,
  onDeleteRule,
}: MarginRulesListProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const controls = useMarginRulesListControls();

  const agencyGroupsResult = useAgencyGroups();
  const serviceTypesResult = useServiceTypes();
  const suppliersResult = useSuppliers();
  const draftSupplierServicesResult = useSupplierServices(
    controls.draftFilters.supplierId
  );
  const appliedSupplierServicesResult = useSupplierServices(
    controls.appliedFilters.supplierId
  );
  const agencyGroups = Array.isArray(agencyGroupsResult.data)
    ? agencyGroupsResult.data
    : [];
  const serviceTypes = Array.isArray(serviceTypesResult.data)
    ? serviceTypesResult.data
    : [];
  const suppliers = Array.isArray(suppliersResult.data)
    ? suppliersResult.data
    : [];
  const draftSupplierServices = Array.isArray(draftSupplierServicesResult.data)
    ? draftSupplierServicesResult.data
    : [];
  const appliedSupplierServices = Array.isArray(
    appliedSupplierServicesResult.data
  )
    ? appliedSupplierServicesResult.data
    : [];

  const {
    data,
    items,
    totalCount,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    resetToFirstPage,
  } = useMarginRulesList(controls.queryInput);

  const agencyGroupOptions = useMemo(
    () =>
      agencyGroups
        .filter((agencyGroup) => agencyGroup.isActive)
        .map((agencyGroup) =>
          toDropdownOption(agencyGroup.id, agencyGroup.name)
        )
        .sort(byLabelAsc),
    [agencyGroups]
  );

  const serviceTypeOptions = useMemo(
    () =>
      serviceTypes
        .map((serviceType) =>
          toDropdownOption(
            serviceType.id,
            serviceType.displayName || serviceType.name
          )
        )
        .sort(byLabelAsc),
    [serviceTypes]
  );

  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((supplier) => supplier.isActive)
        .map((supplier) => toDropdownOption(supplier.id, supplier.name))
        .sort(byLabelAsc),
    [suppliers]
  );

  const draftServiceDropdownOptions = useMemo(
    () =>
      draftSupplierServices
        .filter(
          (service) =>
            service.isActive &&
            matchesSelectedServiceType(
              service,
              controls.draftFilters.serviceTypeId,
              serviceTypes
            )
        )
        .map((service) =>
          toDropdownOption(service.id, getSupplierServiceLabel(service))
        )
        .sort(byLabelAsc),
    [controls.draftFilters.serviceTypeId, draftSupplierServices, serviceTypes]
  );
  const selectedDraftService = useMemo(
    () =>
      draftSupplierServices.find(
        (service) => service.id === controls.draftFilters.serviceId
      ) ?? null,
    [controls.draftFilters.serviceId, draftSupplierServices]
  );

  const draftOptionDropdownOptions = useMemo(
    () =>
      (selectedDraftService?.options ?? [])
        .filter((option) => option.isActive)
        .map((option) =>
          toDropdownOption(option.id, getServiceOptionLabel(option))
        )
        .sort(byLabelAsc),
    [selectedDraftService?.options]
  );
  const selectedAppliedService = useMemo(
    () =>
      appliedSupplierServices.find(
        (service) => service.id === controls.appliedFilters.serviceId
      ) ?? null,
    [appliedSupplierServices, controls.appliedFilters.serviceId]
  );

  const chipLabelMap = useMemo(
    () =>
      createChipLabelMap({
        agencyGroups,
        serviceTypes,
        suppliers,
        appliedSupplierServices,
        appliedServiceOptions: selectedAppliedService?.options ?? [],
      }),
    [
      agencyGroups,
      appliedSupplierServices,
      selectedAppliedService?.options,
      serviceTypes,
      suppliers,
    ]
  );

  const appliedFilterChips = useMemo(
    () =>
      createAppliedFilterChips({
        appliedFilterOrder: controls.appliedFilterOrder,
        appliedFilters: controls.appliedFilters,
        chipLabelMap,
        t,
      }),
    [chipLabelMap, controls.appliedFilterOrder, controls.appliedFilters, t]
  );

  const chipOptionsMap = useMemo<
    Partial<Record<MarginRulesFilterChip["key"], DropdownSelectOption[]>>
  >(
    () => ({
      agencyGroupId: agencyGroupOptions,
      serviceTypeId: serviceTypeOptions,
      supplierId: supplierOptions,
      serviceId: appliedSupplierServices
        .filter(
          (service) =>
            service.isActive &&
            matchesSelectedServiceType(
              service,
              controls.appliedFilters.serviceTypeId,
              serviceTypes
            )
        )
        .map((service) =>
          toDropdownOption(service.id, getSupplierServiceLabel(service))
        )
        .sort(byLabelAsc),
      optionId: (selectedAppliedService?.options ?? [])
        .filter((option) => option.isActive)
        .map((option) =>
          toDropdownOption(option.id, getServiceOptionLabel(option))
        )
        .sort(byLabelAsc),
    }),
    [
      agencyGroupOptions,
      appliedSupplierServices,
      controls.appliedFilters.serviceTypeId,
      selectedAppliedService?.options,
      serviceTypeOptions,
      serviceTypes,
      supplierOptions,
    ]
  );

  const {
    firstLineRef,
    countRef,
    dotMeasureRef,
    setChipMeasureRef,
    visibleChips,
    hiddenChips,
  } = useVisibleMarginRulesFilterChips(appliedFilterChips);

  const hasSearchOrFilters =
    Boolean(controls.appliedSearch) || controls.hasAppliedFilters;
  const hasRows = items.length > 0;
  const shouldResetToFirstPageOnBackToTop = (data?.pages?.length ?? 0) > 1;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden">
      <MarginRulesListToolbar
        searchQuery={controls.searchQuery}
        onSearchQueryChange={controls.setSearchQuery}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        filters={controls.draftFilters}
        onFilterChange={controls.updateDraftFilter}
        onApply={controls.applyFilters}
        onReset={controls.resetFilters}
        agencyGroupOptions={agencyGroupOptions}
        serviceTypeOptions={serviceTypeOptions}
        supplierOptions={supplierOptions}
        serviceOptions={draftServiceDropdownOptions}
        optionOptions={draftOptionDropdownOptions}
      />

      <MarginRulesListFiltersBar
        totalCount={totalCount}
        visibleChips={visibleChips}
        hiddenChips={hiddenChips}
        appliedFilterChips={appliedFilterChips}
        chipOptionsMap={chipOptionsMap}
        showHiddenChips={controls.showHiddenChips}
        onToggleHiddenChips={() =>
          controls.setShowHiddenChips(!controls.showHiddenChips)
        }
        onUpdateFilter={controls.updateAppliedFilter}
        onRemoveFilter={controls.removeAppliedFilter}
        onClearAll={controls.clearAllAppliedFilters}
        hideExpired={controls.hideExpired}
        onHideExpiredChange={controls.setHideExpired}
        firstLineRef={firstLineRef}
        countRef={countRef}
        dotMeasureRef={dotMeasureRef}
        setChipMeasureRef={setChipMeasureRef}
      />

      <MarginRulesListContent
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasRows={hasRows}
        hasSearchOrFilters={hasSearchOrFilters}
        rows={items}
        sortBy={controls.sortBy}
        sortDirection={controls.sortDirection}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={Boolean(hasNextPage)}
        onSort={controls.toggleSort}
        onLoadMore={() => {
          void fetchNextPage();
        }}
        shouldResetToFirstPageOnBackToTop={shouldResetToFirstPageOnBackToTop}
        onResetToFirstPage={() => {
          void resetToFirstPage();
        }}
        onRetry={() => {
          void resetToFirstPage();
        }}
        onCreateAction={onCreateAction}
        onDuplicateRule={onDuplicateRule}
        onEditRule={onEditRule}
        onDeleteRule={onDeleteRule}
      />
    </div>
  );
}
