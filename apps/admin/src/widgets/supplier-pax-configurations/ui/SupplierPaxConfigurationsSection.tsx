import {
  Button,
  Card,
  CardContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sol/ui";
import { Info, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSupplierPaxTypeSchedules } from "@/entities/supplier-pax-type-schedule";
import { AddPaxConfigurationSheet } from "@/features/create-supplier-pax-type-schedule";

import { PaxConfigurationAccordion } from "./PaxConfigurationAccordion";

interface SupplierPaxConfigurationsSectionProps {
  supplierId: string;
}

export function SupplierPaxConfigurationsSection({
  supplierId,
}: SupplierPaxConfigurationsSectionProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    data: schedules = [],
    isLoading,
    error,
  } = useSupplierPaxTypeSchedules(supplierId);

  const defaultExpandedId = useMemo(
    () =>
      schedules.find((schedule) => !schedule.validTo)?.id ?? schedules[0]?.id,
    [schedules]
  );

  useEffect(() => {
    if (!schedules.length) {
      setExpandedId(null);
      return;
    }
    setExpandedId((current) =>
      current && schedules.some((schedule) => schedule.id === current)
        ? current
        : (defaultExpandedId ?? null)
    );
  }, [defaultExpandedId, schedules]);

  return (
    <>
      <Card id="pax-types-ages" className="rounded-[6px]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 leading-6">
                    {t("admin:labels.paxTypesAndAges")}
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex size-5 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900"
                        aria-label={t(
                          "admin:supplierPaxConfigurations.infoLabel"
                        )}
                      >
                        <Info className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-[320px] text-white [&_*]:text-white"
                    >
                      <p>{t("admin:supplierPaxConfigurations.infoTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="max-w-[720px] text-sm font-medium text-neutral-600 leading-6">
                  {t("admin:supplierPaxConfigurations.subtitle")}
                  <br />
                  {t("admin:supplierPaxConfigurations.changeInstruction")}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSheetOpen(true)}>
                <Plus className="w-4 h-4" />
                {t("admin:supplierPaxConfigurations.add")}
              </Button>
            </div>

            {error ? (
              <p className="text-sm font-medium text-destructive">
                {t("admin:supplierPaxConfigurations.failedToLoad")}
              </p>
            ) : schedules.length > 0 ? (
              <div className="flex flex-col gap-3" aria-busy={isLoading}>
                {schedules.map((schedule) => (
                  <PaxConfigurationAccordion
                    key={schedule.id}
                    schedule={schedule}
                    expanded={expandedId === schedule.id}
                    onToggle={() =>
                      setExpandedId((current) =>
                        current === schedule.id ? null : schedule.id
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-border px-6 py-12 text-center">
                <h3 className="text-base font-bold text-foreground leading-6">
                  {t("admin:supplierPaxConfigurations.emptyTitle")}
                </h3>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setSheetOpen(true)}
                  className="mt-4"
                >
                  <Plus className="size-4" />
                  {t("admin:supplierPaxConfigurations.add")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddPaxConfigurationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        supplierId={supplierId}
      />
    </>
  );
}
