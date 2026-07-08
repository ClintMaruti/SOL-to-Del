import { getErrorMessage } from "@sol/api-client";
import { Button, Skeleton, cn } from "@sol/ui";
import { SquarePen, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useServiceRates, type ServiceRate } from "@/entities/service-rate";
import { ServiceRateDialog } from "@/features/manage-service-rates";
import {
  SORTABLE_TABLE_HEAD_BUTTON_CLASS,
  SortIcon,
} from "@/shared/components/Table";

import { useServiceRatesIdentitySort } from "../model/useServiceRatesIdentitySort";
import { ServiceRatesEmptyState } from "./ServiceRatesEmptyState";

function formatChargeType(
  chargeType: ServiceRate["chargeType"],
  t: (key: string) => string
): string {
  return chargeType === "Person"
    ? t("extraDetail.chargeType.person")
    : t("extraDetail.chargeType.unit");
}

interface ServiceRatesIdentitySectionProps {
  serviceId: string;
  expandRateId?: string | null;
}

export function ServiceRatesIdentitySection({
  serviceId,
  expandRateId,
}: ServiceRatesIdentitySectionProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    data: rates = [],
    isLoading,
    error,
    refetch,
  } = useServiceRates(serviceId);
  const { sortState, handleSort, sortedRates } =
    useServiceRatesIdentitySort(rates);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRate, setEditRate] = useState<ServiceRate | null>(null);

  const lastScrollRateIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!expandRateId || isLoading || rates.length === 0) return;
    if (lastScrollRateIdRef.current === expandRateId) return;

    const el = document.getElementById(`service-rate-${expandRateId}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      lastScrollRateIdRef.current = expandRateId;
    }
  }, [expandRateId, isLoading, rates.length]);

  const toggleSortField = (field: "name" | "chargeType") => {
    handleSort(
      field,
      sortState.field === field && sortState.direction === "asc"
        ? "desc"
        : "asc"
    );
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-bold text-foreground">
            {t("sections.rates")}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {t("serviceRates.identityDescription")}
          </p>
        </div>
        <Button
          variant="outline"
          className="border-brand-red text-brand-red hover:bg-white hover:text-brand-red"
          onClick={() => setCreateOpen(true)}
        >
          {t("serviceRates.createRate")}
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-[6px] border border-border-tertiary">
          <Skeleton className="h-9 w-full rounded-none" />
          <Skeleton className="h-9 w-full rounded-none" />
          <Skeleton className="h-9 w-full rounded-none" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-destructive">
            {getErrorMessage(error, t("errors.failedToLoadRates"))}
          </p>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => refetch()}
          >
            {t("buttons.retry")}
          </Button>
        </div>
      ) : sortedRates.length === 0 ? (
        <ServiceRatesEmptyState
          title={t("serviceRates.noRatesYetTitle")}
          description={t("serviceRates.noRatesYetDescription")}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              {t("serviceRates.createRate")}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[6px] border border-border-tertiary">
          <div className="grid grid-cols-[1fr_1fr_88px] border-b border-border-tertiary bg-gray-200">
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className={cn(
                  SORTABLE_TABLE_HEAD_BUTTON_CLASS,
                  "text-foreground hover:text-foreground"
                )}
                onClick={() => toggleSortField("name")}
              >
                {t("labels.rateName")}
                <SortIcon
                  columnKey="name"
                  sortKey={sortState.field}
                  sortDirection={sortState.direction}
                />
              </Button>
            </div>
            <div className="border-l border-border-tertiary px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className={cn(
                  SORTABLE_TABLE_HEAD_BUTTON_CLASS,
                  "text-foreground hover:text-foreground"
                )}
                onClick={() => toggleSortField("chargeType")}
              >
                {t("labels.chargeType")}
                <SortIcon
                  columnKey="chargeType"
                  sortKey={sortState.field}
                  sortDirection={sortState.direction}
                />
              </Button>
            </div>
            <div className="border-l border-border-tertiary px-3 py-2 text-center text-sm font-semibold text-foreground">
              {t("tableHeaders.actions")}
            </div>
          </div>
          {sortedRates.map((rate) => (
            <div
              key={rate.id}
              id={`service-rate-${rate.id}`}
              className="grid grid-cols-[1fr_1fr_88px] border-b border-border-tertiary bg-white last:border-b-0"
            >
              <div className="flex h-9 items-center px-3 text-sm text-foreground">
                {rate.name}
              </div>
              <div className="flex h-9 items-center border-l border-border-tertiary px-3 text-sm text-foreground">
                {formatChargeType(rate.chargeType, t)}
              </div>
              <div className="flex h-9 items-center justify-end gap-0 border-l border-border-tertiary">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-8 rounded-none"
                  aria-label={t("common:buttons.edit")}
                  onClick={() => setEditRate(rate)}
                >
                  <SquarePen className="h-4 w-4 text-brand-red" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-8 rounded-none"
                  aria-label={t("common:buttons.delete")}
                  disabled
                  title={t("serviceRates.deleteRateNotSupported")}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground opacity-40" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceRateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        serviceId={serviceId}
        rate={null}
        title={t("serviceRates.createRate")}
      />

      <ServiceRateDialog
        open={Boolean(editRate)}
        onOpenChange={(open) => !open && setEditRate(null)}
        serviceId={serviceId}
        rate={editRate}
        title={t("serviceRates.editRate")}
      />
    </section>
  );
}
