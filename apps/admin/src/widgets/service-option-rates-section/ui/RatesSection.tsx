import { getErrorMessage } from "@sol/api-client";
import { Button, Skeleton } from "@sol/ui";
import { CircleAlert, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  isDraftServiceOptionId,
  useServiceOptionRates,
  type ServiceOptionRate,
} from "@/entities/service-option-rate";
import {
  createNewRateDraftInitialData,
  type RateContractValidity,
  type RateFormSubmitData,
} from "@/features/manage-service-option-rates";

import { RateCard } from "./RateCard";

interface RateCardEntry {
  key: string;
  rateId?: string;
  initialData?: RateFormSubmitData;
  /** True only for rows created via Duplicate; used so Save is enabled without an edit (form baseline matches copied data). */
  isDuplicateDraft?: boolean;
}

export interface RatesSectionProps {
  serviceOptionId: string | null;
  contractId: string | null;
  /** Selected supplier contract validity for travel-date boundary validation. */
  contractValidity?: RateContractValidity | null;
  /** Open the persisted rate card with this id (e.g. service list deep link). */
  expandRateId?: string | null;
}

export function RatesSection({
  serviceOptionId,
  contractId,
  contractValidity = null,
  expandRateId = null,
}: RatesSectionProps) {
  const { t } = useTranslation("admin");
  const isDraftOption = isDraftServiceOptionId(serviceOptionId);

  const {
    data: rates = [],
    isLoading,
    error,
    refetch,
  } = useServiceOptionRates(serviceOptionId);

  const contractSelected = Boolean(contractId);
  const selectContractHintId = useId();

  const existingEntries = useMemo<RateCardEntry[]>(
    () =>
      rates.map((r) => ({
        key: r.id,
        rateId: r.id,
        initialData: {
          name: r.name,
          chargeType: r.chargeType,
          timeUnit: r.timeUnit,
          version: r.version,
          contractedRates: r.contractedRates,
        },
      })) as RateCardEntry[],
    [rates]
  );

  const [newEntries, setNewEntries] = useState<RateCardEntry[]>([]);
  /** After first save of a new rate, remounted card opens expanded (matches server id). */
  const [expandRateIdAfterCreate, setExpandRateIdAfterCreate] = useState<
    string | null
  >(null);

  const allEntries = [...existingEntries, ...newEntries];

  const handleAddRate = () => {
    setNewEntries((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        initialData: createNewRateDraftInitialData(),
      },
    ]);
  };

  const handleDuplicate = (data: RateFormSubmitData) => {
    setNewEntries((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        initialData: data,
        isDuplicateDraft: true,
      },
    ]);
  };

  const handleDelete = (key: string) => {
    setNewEntries((prev) => prev.filter((e) => e.key !== key));
  };

  if (isDraftOption) {
    return (
      <div className="flex flex-col gap-4 rounded-b-[6px] border border-t-0 border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">
            {t("sections.rates")}
          </h3>
          <Button variant="ghost" size="sm" disabled className="text-brand-red">
            <Plus className="mr-1 h-4 w-4" />
            {t("buttons.add")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-b-[6px] border border-t-0 border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    const message = getErrorMessage(error, t("errors.failedToLoadRates"));
    return (
      <div className="flex flex-col gap-4 rounded-b-[6px] border border-t-0 border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">
            {t("sections.rates")}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">{message}</p>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => refetch()}
          >
            {t("buttons.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-b-[6px] border border-t-0 border-border p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-foreground">
          {t("sections.rates")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-red hover:text-brand-red"
          onClick={handleAddRate}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("buttons.add")}
        </Button>
      </div>
      {!contractSelected && (
        <div
          id={selectContractHintId}
          className="flex items-start gap-3 rounded-[6px] bg-sky-100 px-4 py-3"
          role="status"
        >
          <CircleAlert className="size-4 shrink-0 text-sky-600" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sky-600">
            <p className="text-sm font-bold leading-5 text-sky-600">
              {t("empty.selectContractFirstTitle")}
            </p>
            <p className="text-sm font-medium leading-6 text-sky-600/80">
              {t("empty.selectContractFirstRates")}
            </p>
          </div>
        </div>
      )}

      {/* Rate Cards or Empty State */}
      {allEntries.length === 0 && contractSelected ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty.noRates")}</p>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleAddRate}
            disabled={!contractSelected}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("buttons.add")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {allEntries.map(({ key, rateId, initialData, isDuplicateDraft }) => (
            <RateCard
              key={key}
              htmlIdPrefix={`rate-${key}`}
              rateId={rateId}
              initialData={initialData}
              isDuplicateDraft={isDuplicateDraft}
              serviceOptionId={serviceOptionId ?? undefined}
              contractId={contractId}
              contractValidity={contractValidity}
              expandRateId={expandRateId}
              defaultOpen={Boolean(
                rateId &&
                (expandRateIdAfterCreate === rateId || expandRateId === rateId)
              )}
              onDuplicate={handleDuplicate}
              onDraftRateCreated={
                rateId
                  ? undefined
                  : (created: ServiceOptionRate) => {
                      setExpandRateIdAfterCreate(created.id);
                      handleDelete(key);
                    }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
