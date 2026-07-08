import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@sol/ui";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useContractedRates } from "@/entities/contracted-rate";
import { useServiceRates } from "@/entities/service-rate";
import type { SupplierContract } from "@/entities/supplier-contract";
import { useServiceOptions } from "@/entities/supplier-service-options";
import { ContractedRateFormDialog } from "@/features/manage-contracted-rates";
import { useServiceRatesFilters } from "@/features/filter-service-rates";

import type { ContractedRateSeasonGroup } from "../lib/groupContractedRates";
import {
  draftToFiltersPatch,
  type ServiceRatesFiltersDraft,
} from "../model/serviceRatesFiltersDraft";

import { ContractedRatesTable } from "./ContractedRatesTable";
import { ServiceRatesEmptyState } from "./ServiceRatesEmptyState";
import { ServiceRatesContractedToolbar } from "./ServiceRatesContractedToolbar";

interface ServiceRatesContractedSectionProps {
  serviceId: string;
  contracts: SupplierContract[];
}

export function ServiceRatesContractedSection({
  serviceId,
  contracts,
}: ServiceRatesContractedSectionProps) {
  const { t } = useTranslation("admin");
  const { data: rates = [] } = useServiceRates(serviceId);
  const { data: options = [] } = useServiceOptions(serviceId);

  const {
    filterState,
    apiQueryParams,
    clientFilterRows,
    setContractId,
    applyFilters,
    clearAllFilters,
    removeFilterChip,
  } = useServiceRatesFilters(rates);

  const {
    data: contractedRows = [],
    isLoading,
    error,
    refetch,
  } = useContractedRates(serviceId, apiQueryParams);

  const [addOpen, setAddOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [duplicateGroup, setDuplicateGroup] = useState<
    ContractedRateSeasonGroup | undefined
  >();
  const [editGroup, setEditGroup] = useState<ContractedRateSeasonGroup | null>(
    null
  );

  const filteredRows = useMemo(
    () => clientFilterRows(contractedRows),
    [contractedRows, clientFilterRows]
  );

  const contractSelected = Boolean(filterState.contractId);

  const handleApplyFilters = (draft: ServiceRatesFiltersDraft) => {
    applyFilters(draftToFiltersPatch(draft));
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-bold text-foreground">
            {t("serviceRates.contractedTitle")}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {t("serviceRates.contractedDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            {t("labels.contract")}
          </span>
          <Select
            value={filterState.contractId ?? ""}
            onValueChange={(v) => setContractId(v || null)}
          >
            <SelectTrigger className="h-9 min-w-[240px] rounded-[6px]">
              <SelectValue placeholder={t("placeholders.selectContract")} />
            </SelectTrigger>
            <SelectContent>
              {contracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-brand-red text-brand-red"
            disabled={!contractSelected}
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("buttons.add")}
          </Button>
        </div>
      </div>

      {!contractSelected ? (
        <ServiceRatesEmptyState
          title={t("serviceRates.chooseContractFirstTitle")}
          description={t("serviceRates.chooseContractFirstDescription")}
        />
      ) : isLoading ? (
        <Skeleton className="h-48 w-full rounded-[6px]" />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-destructive">
            {getErrorMessage(
              error,
              t("serviceRates.failedToLoadContractedRates")
            )}
          </p>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => refetch()}
          >
            {t("buttons.retry")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          <ServiceRatesContractedToolbar
            matchingCount={filteredRows.length}
            filterState={filterState}
            options={options}
            rates={rates}
            filtersOpen={filtersOpen}
            onFiltersOpenChange={setFiltersOpen}
            onApplyFilters={handleApplyFilters}
            onRemoveFilter={removeFilterChip}
            onClearAllFilters={clearAllFilters}
          />
          {filteredRows.length === 0 ? (
            <div className="rounded-b-[6px] border border-t-0 border-border-tertiary">
              <ServiceRatesEmptyState
                title={t("empty.noContractedRates")}
                description={t("serviceRates.noContractedRatesDescription")}
                action={
                  <Button onClick={() => setAddOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    {t("buttons.add")}
                  </Button>
                }
              />
            </div>
          ) : (
            <ContractedRatesTable
              rows={filteredRows}
              options={options}
              rates={rates}
              onDuplicateSeason={(group) => {
                setDuplicateGroup(group);
                setAddOpen(true);
              }}
              onEditSeason={(group) => setEditGroup(group)}
            />
          )}
        </div>
      )}

      {contractSelected && (
        <>
          <ContractedRateFormDialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) setDuplicateGroup(undefined);
            }}
            mode={duplicateGroup ? "duplicate" : "add"}
            serviceId={serviceId}
            contractId={filterState.contractId!}
            contracts={contracts}
            options={options}
            rates={rates}
            existingRows={contractedRows}
            duplicateFrom={duplicateGroup?.rows}
          />
          {editGroup && (
            <ContractedRateFormDialog
              open={editGroup !== null}
              onOpenChange={(open) => {
                if (!open) setEditGroup(null);
              }}
              mode="edit"
              serviceId={serviceId}
              contractId={filterState.contractId!}
              contracts={contracts}
              options={options}
              rates={rates}
              existingRows={contractedRows}
              editGroup={editGroup}
            />
          )}
        </>
      )}
    </section>
  );
}
