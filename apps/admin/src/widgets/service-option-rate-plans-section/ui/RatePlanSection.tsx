import { getErrorMessage } from "@sol/api-client";
import { Button, cn, Skeleton } from "@sol/ui";
import { FileX } from "lucide-react";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useServiceRatePlans,
  type RatePlan,
  type RateRule,
} from "@/entities/service-option-rate-plan";
import type { RatePlanFormValues } from "@/features/manage-service-option-rate-plans";

import { compareRatePlansForDefaultList } from "../lib/compareRatePlansForDefaultList";
import { createDuplicateRatePlanDraft } from "../lib/duplicateRatePlanDraft";

import { CreateRatePlanSheet } from "./CreateRatePlanSheet";
import { RatePlanCard } from "./RatePlanCard";

interface RatePlanEntry {
  key: string;
  ratePlan: RatePlan;
  initialValues?: RatePlanFormValues;
  initialRateRules?: RateRule[];
  defaultOpen?: boolean;
}

interface RatePlanSectionProps {
  serviceId: string;
  /** Open the persisted rate plan card with this id (e.g. deep link). */
  expandRatePlanId?: string | null;
}

export function RatePlanSection({
  serviceId,
  expandRatePlanId = null,
}: RatePlanSectionProps) {
  const { t } = useTranslation("admin");
  const {
    data: ratePlans = [],
    isLoading,
    error,
    refetch,
  } = useServiceRatePlans(serviceId);

  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [draftEntries, setDraftEntries] = useState<RatePlanEntry[]>([]);

  const persistedEntries = useMemo<RatePlanEntry[]>(() => {
    const sorted = [...ratePlans].sort(compareRatePlansForDefaultList);
    return sorted.map((rp) => ({ key: rp.id, ratePlan: rp }));
  }, [ratePlans]);

  const allEntries = useMemo(
    () => [...persistedEntries, ...draftEntries],
    [persistedEntries, draftEntries]
  );

  const existingNames = useMemo(
    () => allEntries.map((entry) => entry.ratePlan.name).filter(Boolean),
    [allEntries]
  );

  const isEmpty =
    !isLoading &&
    !error &&
    persistedEntries.length === 0 &&
    draftEntries.length === 0;

  const handleDuplicateRatePlan = useCallback(
    (source: RatePlan, sourceRules: RateRule[]) => {
      const { ratePlan, initialValues, initialRateRules } =
        createDuplicateRatePlanDraft(source, sourceRules);
      setDraftEntries((prev) => [
        ...prev,
        {
          key: ratePlan.id,
          ratePlan,
          initialValues,
          initialRateRules,
          defaultOpen: true,
        },
      ]);
    },
    []
  );

  const handleDraftPersisted = useCallback((draftId: string) => {
    setDraftEntries((prev) => prev.filter((entry) => entry.key !== draftId));
  }, []);

  const handlePlanCreated = useCallback(() => {
    setCreateSheetOpen(false);
  }, []);

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }

    if (error) {
      const message = getErrorMessage(error, t("errors.failedToLoadRates"));
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">{message}</p>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => refetch()}
          >
            {t("buttons.retry")}
          </Button>
        </div>
      );
    }

    if (allEntries.length === 0) {
      return (
        <div className="-mb-6 flex min-h-0 flex-1 items-center justify-center rounded-md border border-border-tertiary bg-white px-6 py-20">
          <div className="flex max-w-md flex-col items-center text-center">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-[6px] bg-sky-100">
              <FileX className="h-6 w-6 text-sky-600" aria-hidden />
            </div>
            <h3 className="text-xl font-bold leading-8 text-text-primary">
              {t("empty.noRatePlansYet")}
            </h3>
            <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">
              {t("empty.noRatePlansDescription")}
            </p>
            <Button
              type="button"
              variant="primary"
              className="mt-6"
              onClick={() => setCreateSheetOpen(true)}
            >
              {t("buttons.createRatePlan")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {allEntries.map((entry) => (
          <Fragment key={entry.key}>
            <RatePlanCard
              entryKey={entry.key}
              ratePlan={entry.ratePlan}
              serviceId={serviceId}
              existingNames={existingNames}
              initialFormValues={entry.initialValues}
              initialRateRules={entry.initialRateRules}
              defaultOpen={entry.defaultOpen ?? true}
              expandRatePlanId={expandRatePlanId}
              onDuplicate={handleDuplicateRatePlan}
              onDraftPersisted={handleDraftPersisted}
            />
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 pt-4",
        isEmpty &&
          "min-h-[calc(100dvh-4rem-var(--layout-reserved-footer-height,0px)-16rem)] flex-1"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold leading-6 text-text-primary">
            {t("sections.ratePlan")}
          </h2>
          <p className="text-sm font-medium leading-6 text-text-secondary">
            {t("sections.ratePlanDescription")}
          </p>
        </div>
        {!isLoading && !error ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            className="shrink-0 border-brand-red text-brand-red hover:bg-brand-red/5 hover:text-brand-red"
            onClick={() => setCreateSheetOpen(true)}
          >
            {t("buttons.createRatePlan")}
          </Button>
        ) : null}
      </div>

      <div className={cn(isEmpty && "flex min-h-0 flex-1 flex-col")}>
        {renderBody()}
      </div>

      <CreateRatePlanSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        serviceId={serviceId}
        existingNames={existingNames}
        onCreated={handlePlanCreated}
      />
    </div>
  );
}
