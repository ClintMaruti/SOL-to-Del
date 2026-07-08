import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@sol/ui";
import { i18n } from "@sol/i18n";
import { TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  ContractedRate,
  ContractedRateDateItemRequest,
  ContractedRateSeasonGroup,
  CreateContractedRatesRequestBody,
} from "@/entities/contracted-rate";
import {
  useCreateContractedRatesBatch,
  useUpdateContractedRate,
} from "@/entities/contracted-rate";
import type { ServiceRate } from "@/entities/service-rate";
import type { SupplierContract } from "@/entities/supplier-contract";
import type { ServiceOption } from "@/entities/supplier-service-options";

import { applyContractedRateApiErrors } from "../model/applyContractedRateApiErrors";
import {
  validateContractedRateForm,
  type ContractedRateFormFieldErrors,
} from "../model/contractedRateFormValidation";
import {
  hasContractedRateOverlap,
  type ContractedRateOverlapRow,
} from "../model/contractedRateOverlap";

import {
  ContractedRateBookingWindowSection,
  type BookingWindowRow,
} from "./ContractedRateBookingWindowSection";
import {
  ContractedRatePriceMatrixTable,
  type ContractedRatePriceRowState,
} from "./ContractedRatePriceMatrixTable";
import { ContractedRateModalHeaderFields } from "./ContractedRateModalHeaderFields";
import { ContractedRateTravelDatesTable } from "./ContractedRateTravelDatesTable";
import { DashedSeparator } from "./DashedSeparator";

function extractBookingWindowsFromDates(
  dates: ContractedRateDateItemRequest[]
): BookingWindowRow[] {
  const seen = new Set<string>();
  const rows: BookingWindowRow[] = [];
  for (const date of dates) {
    const from = date.bookingWindowFrom?.trim() ?? "";
    const to = date.bookingWindowTo?.trim() ?? "";
    if (!from && !to) continue;
    const key = `${from}|${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      bookingWindowFrom: date.bookingWindowFrom ?? null,
      bookingWindowTo: date.bookingWindowTo ?? null,
    });
  }
  return rows;
}

function applyBookingWindowsToDates(
  dates: ContractedRateDateItemRequest[],
  bookingWindows: BookingWindowRow[]
): ContractedRateDateItemRequest[] {
  if (!bookingWindows.length) {
    return dates;
  }
  const primary = bookingWindows[0]!;
  return dates.map((date, index) => {
    const bw = bookingWindows[index] ?? primary;
    return {
      ...date,
      bookingWindowFrom: bw.bookingWindowFrom,
      bookingWindowTo: bw.bookingWindowTo,
    };
  });
}

export interface ContractedRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "duplicate" | "edit";
  serviceId: string;
  contractId: string;
  contracts: SupplierContract[];
  options: ServiceOption[];
  rates: ServiceRate[];
  existingRows: ContractedRate[];
  duplicateFrom?: ContractedRate[];
  /** Provided in edit mode — the group being edited */
  editGroup?: ContractedRateSeasonGroup;
}

const emptyDateRow = (): ContractedRateDateItemRequest => ({
  travelDateFrom: "",
  travelDateTo: "",
  bookingWindowFrom: null,
  bookingWindowTo: null,
  weekdays: [],
});

function buildPriceRows(
  options: ServiceOption[],
  rates: ServiceRate[],
  mode: "add" | "duplicate" | "edit",
  sourceRows?: ContractedRate[]
): ContractedRatePriceRowState[] {
  const rows: ContractedRatePriceRowState[] = [];
  for (const opt of options) {
    for (const rate of rates) {
      const src = sourceRows?.find(
        (r) => r.serviceOptionId === opt.id && r.rateId === rate.id
      );
      rows.push({
        key: `${opt.id}:${rate.id}`,
        id: mode === "edit" ? src?.id : undefined,
        version: mode === "edit" ? (src?.version ?? 1) : undefined,
        serviceOptionId: opt.id,
        rateId: rate.id,
        optionLabel: opt.title,
        rateLabel: rate.name,
        checked: mode !== "add" ? Boolean(src) : false,
        net: src?.net?.value != null ? String(src.net.value) : "",
        rack: src?.rack?.value != null ? String(src.rack.value) : "",
        sell: src?.sell?.value != null ? String(src.sell.value) : "",
      });
    }
  }
  return rows;
}

function buildInitialDates(
  mode: "add" | "duplicate" | "edit",
  sourceRows?: ContractedRate[],
  editGroup?: ContractedRateSeasonGroup
): ContractedRateDateItemRequest[] {
  if (mode === "edit" && editGroup?.dates?.length) {
    return editGroup.dates.map((d) => ({
      id: d.id,
      travelDateFrom: d.travelDateFrom,
      travelDateTo: d.travelDateTo,
      bookingWindowFrom: d.bookingWindowFrom ?? null,
      bookingWindowTo: d.bookingWindowTo ?? null,
      weekdays: d.weekdays ?? [],
    }));
  }
  const seed = sourceRows?.[0];
  if (mode === "duplicate" && seed?.dates?.length) {
    return seed.dates.map((d) => ({
      id: null,
      travelDateFrom: d.travelDateFrom,
      travelDateTo: d.travelDateTo,
      bookingWindowFrom: d.bookingWindowFrom ?? null,
      bookingWindowTo: d.bookingWindowTo ?? null,
      weekdays: d.weekdays ?? [],
    }));
  }
  return [emptyDateRow()];
}

export function ContractedRateFormDialog({
  open,
  onOpenChange,
  mode,
  serviceId,
  contractId,
  contracts,
  options,
  rates,
  existingRows,
  duplicateFrom,
  editGroup,
}: ContractedRateFormDialogProps) {
  const { t } = useTranslation(["admin", "common"]);
  const tAdmin = (key: string, options?: Record<string, unknown>) =>
    t(key, { ns: "admin", ...options });
  // In edit mode we fire multiple mutations — use silent=true to avoid N toasts; one is shown in handleSave.
  const createBatch = useCreateContractedRatesBatch(serviceId, contractId, {
    silent: mode === "edit",
    suppressErrorToast: true,
  });
  const updateRate = useUpdateContractedRate(serviceId, contractId, {
    silent: mode === "edit",
    suppressErrorToast: true,
  });

  const [seasonName, setSeasonName] = useState("");
  const [priority, setPriority] = useState("100");
  const [dates, setDates] = useState<ContractedRateDateItemRequest[]>([
    emptyDateRow(),
  ]);
  const [priceRows, setPriceRows] = useState<ContractedRatePriceRowState[]>([]);
  const [bookingWindows, setBookingWindows] = useState<BookingWindowRow[]>([]);

  const [fieldErrors, setFieldErrors] =
    useState<ContractedRateFormFieldErrors | null>(null);

  const clearValidationErrors = () => {
    setFieldErrors(null);
  };

  const resetForm = useCallback(() => {
    if (mode === "edit" && editGroup) {
      const initialDates = buildInitialDates("edit", undefined, editGroup);
      setSeasonName(editGroup.seasonName);
      setPriority(String(editGroup.priority));
      setDates(initialDates);
      setBookingWindows(extractBookingWindowsFromDates(initialDates));
      setPriceRows(buildPriceRows(options, rates, "edit", editGroup.rows));
    } else {
      const seed = duplicateFrom?.[0];
      const initialDates = buildInitialDates(mode, duplicateFrom);
      setSeasonName(
        mode === "duplicate" && seed ? `${seed.seasonName} Copy` : ""
      );
      setPriority(
        String(mode === "duplicate" && seed ? seed.priority + 1 : 100)
      );
      setDates(initialDates);
      setBookingWindows(extractBookingWindowsFromDates(initialDates));
      setPriceRows(buildPriceRows(options, rates, mode, duplicateFrom));
    }
    setFieldErrors(null);
  }, [mode, duplicateFrom, editGroup, options, rates]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const contractLabel =
    contracts.find((c) => c.id === contractId)?.name ?? contractId;

  const editGroupParentIds = useMemo(
    () => new Set(editGroup?.rows.map((r) => r.contractedRateId) ?? []),
    [editGroup]
  );
  const overlapExisting: ContractedRateOverlapRow[] = useMemo(
    () =>
      existingRows
        .filter((r) => !editGroupParentIds.has(r.contractedRateId))
        .map((r) => ({
          id: r.id,
          contractId: r.contractId,
          serviceOptionId: r.serviceOptionId,
          rateId: r.rateId,
          priority: r.priority,
          dates: r.dates.map((d) => ({
            travelDateFrom: d.travelDateFrom,
            travelDateTo: d.travelDateTo,
            bookingWindowFrom: d.bookingWindowFrom,
            bookingWindowTo: d.bookingWindowTo,
            weekdays: d.weekdays ?? [],
          })),
        })),
    [existingRows, editGroupParentIds]
  );

  const handleSave = async () => {
    clearValidationErrors();

    const clientErrors = validateContractedRateForm({
      seasonName,
      priority,
      dates,
      priceRows,
      requireNetRackOnCheckedRows: true,
      t: tAdmin,
    });
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    const priorityNum = Number(priority);
    const selected = priceRows.filter((row) => row.checked);

    const datesWithBookingWindows = applyBookingWindowsToDates(
      dates,
      bookingWindows
    );

    const payload: CreateContractedRatesRequestBody = {
      contractId,
      seasonName: seasonName.trim(),
      priority: priorityNum,
      dates: datesWithBookingWindows.map((d) => ({
        travelDateFrom: d.travelDateFrom,
        travelDateTo: d.travelDateTo,
        bookingWindowFrom: d.bookingWindowFrom,
        bookingWindowTo: d.bookingWindowTo,
        weekdays: d.weekdays ?? [],
      })),
      priceRows: selected.map((r) => ({
        serviceOptionId: r.serviceOptionId,
        rateId: r.rateId,
        net: r.net === "" ? null : Number(r.net),
        rack: r.rack === "" ? null : Number(r.rack),
        sell: r.sell === "" ? null : Number(r.sell),
      })),
    };

    for (const row of payload.priceRows) {
      const candidate: ContractedRateOverlapRow = {
        contractId,
        serviceOptionId: row.serviceOptionId,
        rateId: row.rateId,
        priority: priorityNum,
        dates: payload.dates.map((d) => ({
          travelDateFrom: d.travelDateFrom,
          travelDateTo: d.travelDateTo,
          bookingWindowFrom: d.bookingWindowFrom,
          bookingWindowTo: d.bookingWindowTo,
          weekdays: d.weekdays ?? [],
        })),
      };
      if (hasContractedRateOverlap(candidate, overlapExisting)) {
        setFieldErrors({
          banner: t("errors.contractedRatesConflict"),
          priority: t("errors.contractedRatesConflict"),
          seasonName: undefined,
          dateRows: dates.map(() => t("errors.contractedRatesConflict")),
          priceRows: {},
        });
        return;
      }
    }

    try {
      if (mode === "edit" && editGroup) {
        const parentRow = editGroup.rows[0];
        if (!parentRow) {
          return;
        }

        const primaryBookingWindow = bookingWindows[0];
        const datesToSend = datesWithBookingWindows.map((d) => ({
          id: d.id ?? null,
          travelDateFrom: d.travelDateFrom,
          travelDateTo: d.travelDateTo,
          weekdays: d.weekdays ?? [],
        }));

        await updateRate.mutateAsync({
          id: parentRow.contractedRateId,
          seasonName: payload.seasonName,
          priority: payload.priority,
          bookingWindowFrom: primaryBookingWindow?.bookingWindowFrom ?? null,
          bookingWindowTo: primaryBookingWindow?.bookingWindowTo ?? null,
          options: payload.priceRows.map((row) => {
            const stateRow = priceRows.find(
              (r) =>
                r.serviceOptionId === row.serviceOptionId &&
                r.rateId === row.rateId
            );
            return {
              id: stateRow?.id ?? null,
              serviceOptionId: row.serviceOptionId,
              rateId: row.rateId,
              net: row.net,
              rack: row.rack,
              sell: row.sell,
            };
          }),
          dates: datesToSend,
          version: parentRow.version,
        });

        toast.success(
          i18n.t("serviceRates.contractedRateUpdatedSuccess", { ns: "admin" })
        );
      } else {
        await createBatch.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (error) {
      const applied = applyContractedRateApiErrors(error, {
        setFieldErrors,
        dateRowCount: dates.length,
        priceRows,
      });
      toast.error(
        getErrorMessage(
          error,
          applied
            ? undefined
            : mode === "edit"
              ? t("serviceRates.failedToUpdateContractedRate")
              : t("serviceRates.failedToCreateContractedRates")
        )
      );
    }
  };

  const title =
    mode === "edit"
      ? t("serviceRates.editContractedRate")
      : mode === "duplicate"
        ? t("serviceRates.duplicateContractedRate")
        : t("serviceRates.addContractedRates");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] w-[calc(100%-2rem)] max-w-[942px] flex-col gap-0 p-0 sm:max-w-[942px]"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-border-tertiary px-6 py-4">
          <DialogTitle className="text-lg font-bold text-foreground">
            {title}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("common:buttons.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <DashedSeparator />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
          <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
            {fieldErrors?.banner ? (
              <div className="flex items-center gap-2 rounded-[6px] border border-red-200 bg-red-50 px-4 py-2.5">
                <TriangleAlert className="h-4 w-4 shrink-0 text-brand-red" />
                <p className="text-sm font-semibold text-brand-red">
                  {fieldErrors.banner}
                </p>
              </div>
            ) : null}

            <ContractedRateModalHeaderFields
              contractId={contractId}
              contractLabel={contractLabel}
              seasonName={seasonName}
              seasonNameError={fieldErrors?.seasonName}
              priority={priority}
              priorityError={fieldErrors?.priority}
              onSeasonNameChange={(v) => {
                setSeasonName(v);
                clearValidationErrors();
              }}
              onPriorityChange={(v) => {
                setPriority(v);
                clearValidationErrors();
              }}
            />

            <DashedSeparator />

            <ContractedRateTravelDatesTable
              dates={dates}
              onDatesChange={(d) => {
                setDates(d);
                clearValidationErrors();
              }}
              onAddRow={() => {
                setDates((d) => [...d, emptyDateRow()]);
                clearValidationErrors();
              }}
              dateRowErrors={fieldErrors?.dateRows}
            />

            <DashedSeparator />

            <ContractedRateBookingWindowSection
              rows={bookingWindows}
              onRowsChange={(rows) => {
                setBookingWindows(rows);
                clearValidationErrors();
              }}
              onAddRow={() => {
                setBookingWindows((rows) => [
                  ...rows,
                  { bookingWindowFrom: null, bookingWindowTo: null },
                ]);
                clearValidationErrors();
              }}
            />

            <DashedSeparator />

            <ContractedRatePriceMatrixTable
              priceRows={priceRows}
              priceRowErrors={fieldErrors?.priceRows}
              onPriceRowsChange={(rows) => {
                setPriceRows(rows);
                clearValidationErrors();
              }}
            />
          </div>
        </div>

        <DashedSeparator />

        <div className="flex shrink-0 justify-end gap-3 border-t border-border-tertiary bg-background-primary px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type="button"
            isLoading={createBatch.isPending || updateRate.isPending}
            onClick={() => void handleSave()}
          >
            {t("common:buttons.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
