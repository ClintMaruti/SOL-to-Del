import {
  Button,
  Dialog,
  DialogContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ServiceRate } from "@/entities/service-rate";
import type { ServiceRatesFilterState } from "@/features/filter-service-rates";
import type { ServiceOption } from "@/entities/supplier-service-options";
import { DatePickerGridInput } from "@/shared/ui";

import {
  filterStateToDraft,
  type ServiceRatesFiltersDraft,
} from "../model/serviceRatesFiltersDraft";

interface ServiceRatesFiltersPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterState: ServiceRatesFilterState;
  options: ServiceOption[];
  rates: ServiceRate[];
  onConfirm: (draft: ServiceRatesFiltersDraft) => void;
}

const emptyDraft: ServiceRatesFiltersDraft = {
  optionId: null,
  rateId: null,
  travelDateFrom: null,
  travelDateTo: null,
};

function FilterField({
  label,
  hasValue,
  onClear,
  children,
}: {
  label: string;
  hasValue: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between px-0 py-1">
        <p className="text-sm font-semibold leading-6 text-text-primary">
          {label}
        </p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs font-medium text-blue-500 opacity-80 no-underline hover:no-underline disabled:opacity-40"
          disabled={!hasValue}
          onClick={onClear}
        >
          {t("buttons.clear")}
        </Button>
      </div>
      {children}
    </div>
  );
}

function DashedSeparator() {
  return (
    <div className="h-px w-full border-t border-dashed border-border-tertiary" />
  );
}

export function ServiceRatesFiltersPopover({
  open,
  onOpenChange,
  filterState,
  options,
  rates,
  onConfirm,
}: ServiceRatesFiltersPopoverProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [draft, setDraft] = useState<ServiceRatesFiltersDraft>(() =>
    filterStateToDraft(filterState)
  );

  useEffect(() => {
    if (open) {
      setDraft(filterStateToDraft(filterState));
    }
  }, [open, filterState]);

  const handleApply = () => {
    onConfirm(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft(emptyDraft);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline-secondary"
        className="bg-white"
        onClick={() => onOpenChange(true)}
      >
        <Filter className="size-4" />
        {t("buttons.filters")}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex w-[370px] flex-col gap-0 overflow-hidden rounded-xl border border-border-tertiary p-0 shadow-lg"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-background-primary px-6 pt-6 pb-0">
            <h2 className="text-lg font-bold leading-7 tracking-tight text-text-primary">
              {t("buttons.filters")}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 p-0 text-text-primary hover:bg-transparent"
              onClick={() => onOpenChange(false)}
              aria-label={t("common:buttons.close")}
            >
              <X className="size-4" />
            </Button>
          </div>

          <DashedSeparator />

          {/* Body */}
          <div className="flex flex-col gap-3 bg-white px-4 pt-2 pb-4">
            {/* Option */}
            <FilterField
              label={t("serviceRates.filterOptions")}
              hasValue={Boolean(draft.optionId)}
              onClear={() => setDraft((d) => ({ ...d, optionId: null }))}
            >
              <Select
                value={draft.optionId ?? ""}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, optionId: v || null }))
                }
              >
                <SelectTrigger className="w-full bg-background-primary">
                  <SelectValue placeholder={t("placeholders.all")} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Rate */}
            <FilterField
              label={t("labels.rate")}
              hasValue={Boolean(draft.rateId)}
              onClear={() => setDraft((d) => ({ ...d, rateId: null }))}
            >
              <Select
                value={draft.rateId ?? ""}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, rateId: v || null }))
                }
              >
                <SelectTrigger className="w-full bg-background-primary">
                  <SelectValue placeholder={t("placeholders.all")} />
                </SelectTrigger>
                <SelectContent>
                  {rates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Travel dates */}
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-0">
                <div className="flex items-center justify-between py-1">
                  <p className="text-sm font-semibold leading-6 text-text-primary">
                    {t("serviceRates.dateFrom")}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs font-medium text-blue-500 opacity-80 no-underline hover:no-underline disabled:opacity-40"
                    disabled={!draft.travelDateFrom}
                    onClick={() =>
                      setDraft((d) => ({ ...d, travelDateFrom: null }))
                    }
                  >
                    {t("buttons.clear")}
                  </Button>
                </div>
                <DatePickerGridInput
                  value={draft.travelDateFrom ?? ""}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, travelDateFrom: v || null }))
                  }
                  placeholder={t("placeholders.selectDate")}
                />
              </div>
              <div className="flex flex-1 flex-col gap-0">
                <div className="flex items-center justify-between py-1">
                  <p className="text-sm font-semibold leading-6 text-text-primary">
                    {t("serviceRates.dateTo")}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs font-medium text-blue-500 opacity-80 no-underline hover:no-underline disabled:opacity-40"
                    disabled={!draft.travelDateTo}
                    onClick={() =>
                      setDraft((d) => ({ ...d, travelDateTo: null }))
                    }
                  >
                    {t("buttons.clear")}
                  </Button>
                </div>
                <DatePickerGridInput
                  value={draft.travelDateTo ?? ""}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, travelDateTo: v || null }))
                  }
                  placeholder={t("placeholders.selectDate")}
                />
              </div>
            </div>
          </div>

          <DashedSeparator />

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 bg-background-primary px-6 py-4">
            <Button type="button" variant="secondary" onClick={handleReset}>
              {t("common:buttons.reset")}
            </Button>
            <Button type="button" variant="primary" onClick={handleApply}>
              {t("buttons.apply")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
