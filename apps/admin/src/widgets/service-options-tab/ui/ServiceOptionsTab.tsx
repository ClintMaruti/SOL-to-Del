import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@sol/ui";
import { FileX, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useServiceTypes } from "@/entities/service-type";
import {
  useDeleteServiceOption,
  useServiceOptions,
  useUpdateServiceOption,
  type ServiceOption,
} from "@/entities/supplier-service-options";
import { useSupplierService } from "@/entities/supplier-services";
import {
  backendScheduleTimeToForm,
  buildUpdateServiceOptionPayload,
  isScheduleServiceType,
  OPERATING_DAY_CODES,
  OptionSheet,
  OptionsTabHeader,
  serviceOptionToFormValues,
} from "@/features/manage-service-options";
import {
  BlockedActionDialog,
  ConfirmDeleteDialog,
  SortableHeader,
} from "@/shared/ui";

import { ServiceOptionsTabSkeleton } from "./ServiceOptionsTabSkeleton";

interface ServiceOptionsTabProps {
  serviceId: string | null;
  supplierId: string | null;
}

type OptionSheetState =
  | { mode: "create"; option: null }
  | { mode: "edit"; option: ServiceOption };
type OptionsSortField = "title" | "flightNumber";
type SortDirection = "asc" | "desc";

interface OptionDependencyState {
  title: string;
  dependencies: string[];
  fallbackDescription?: string;
}

function cellText(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || "--";
}

function optionTitleCompare(a: ServiceOption, b: ServiceOption) {
  return a.title.localeCompare(b.title, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function optionFlightNumberCompare(a: ServiceOption, b: ServiceOption) {
  return String(a.flightOption?.flightNumber ?? "").localeCompare(
    String(b.flightOption?.flightNumber ?? ""),
    undefined,
    {
      sensitivity: "base",
      numeric: true,
    }
  );
}

function tableTime(value: string | undefined | null) {
  return backendScheduleTimeToForm(value)
    .replace(/\sAM$/i, " A.M")
    .replace(/\sPM$/i, " P.M");
}

function optionScheduleData(option: ServiceOption) {
  return option.flightOption ?? option.activityOption ?? option.transportOption;
}

function optionSchedule(option: ServiceOption) {
  const schedule = optionScheduleData(option);
  const from = tableTime(schedule?.timeFrom);
  const to = tableTime(schedule?.timeTo);

  if (from && to) return `${from} - ${to}`;
  return from || to || "--";
}

function optionOperatingDays(option: ServiceOption) {
  const schedule = optionScheduleData(option);
  const selected = new Set(
    (schedule?.operatingDays ?? []).map((day) =>
      String(day).trim().toUpperCase()
    )
  );

  return OPERATING_DAY_CODES.filter((day) => selected.has(day));
}

const headerCellClass =
  "h-9 border-r border-border-primary py-1.5 pl-4 pr-2 text-left align-top text-sm font-semibold leading-6 text-text-primary last:border-r-0";
const bodyCellClass =
  "border-r border-border-tertiary py-1.5 pl-4 pr-2 text-left align-top text-sm font-medium leading-6 text-text-primary last:border-r-0";

export function ServiceOptionsTab({
  serviceId,
  supplierId,
}: ServiceOptionsTabProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [sheetState, setSheetState] = useState<OptionSheetState | null>(null);
  const [optionToDelete, setOptionToDelete] = useState<ServiceOption | null>(
    null
  );
  const [blockedDelete, setBlockedDelete] =
    useState<OptionDependencyState | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<OptionsSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const {
    data: optionsData,
    isPending: optionsPending,
    isFetching: optionsFetching,
    error: optionsError,
  } = useServiceOptions(serviceId);
  const { data: supplierService } = useSupplierService(serviceId);
  const { data: serviceTypes = [] } = useServiceTypes();
  const { mutateAsync: updateOptionAsync, isPending: isUpdatingOption } =
    useUpdateServiceOption();
  const {
    mutateAsync: deleteOptionAsync,
    isPending: isDeletingOption,
    error: deleteError,
    reset: resetDeleteOption,
  } = useDeleteServiceOption();

  const options = useMemo(() => optionsData ?? [], [optionsData]);
  const displayedOptions = useMemo(() => {
    if (!sortField) {
      return options;
    }

    const direction = sortDirection === "asc" ? 1 : -1;
    return [...options].sort((a, b) => {
      const compare =
        sortField === "flightNumber"
          ? optionFlightNumberCompare(a, b)
          : optionTitleCompare(a, b);
      return compare * direction;
    });
  }, [options, sortDirection, sortField]);
  const optionsLoading =
    Boolean(serviceId) &&
    optionsData === undefined &&
    (optionsPending || optionsFetching);

  const matchedServiceType = serviceTypes.find(
    (serviceType) => serviceType.id === supplierService?.serviceTypeId
  );
  const serviceTypeName =
    matchedServiceType?.name.toLowerCase() ??
    supplierService?.type?.toLowerCase() ??
    "";
  const isFlightService = serviceTypeName === "flight";
  const isScheduleService = isScheduleServiceType(serviceTypeName);

  const dependenciesByOptionId = useMemo(() => {
    const next = new Map<string, string[]>();
    for (const option of supplierService?.options ?? []) {
      const dependencies: string[] = [];
      if (Array.isArray(option.ratePlans) && option.ratePlans.length > 0) {
        dependencies.push(t("admin:options.dependencies.ratePlans"));
      }
      next.set(option.id, dependencies);
    }
    return next;
  }, [supplierService?.options, t]);

  const openCreateSheet = () => {
    if (!serviceId) return;
    setSheetState({ mode: "create", option: null });
  };

  const openEditSheet = (option: ServiceOption) => {
    setSheetState({ mode: "edit", option });
  };

  const handleSort = (field: OptionsSortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const handleStatusChange = async (
    option: ServiceOption,
    isActive: boolean
  ) => {
    if (!serviceId) return;
    setStatusUpdatingId(option.id);

    try {
      const payload = buildUpdateServiceOptionPayload(
        serviceTypeName,
        {
          ...serviceOptionToFormValues(option, serviceTypeName),
          isActive,
        },
        option.id,
        option.version
      );
      await updateOptionAsync({
        optionId: option.id,
        serviceId,
        supplierId,
        payload,
        suppressSuccessToast: true,
        suppressErrorToast: true,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, t("admin:errors.failedToToggleOptionStatus"))
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteClick = (option: ServiceOption) => {
    const dependencies = dependenciesByOptionId.get(option.id) ?? [];
    if (dependencies.length > 0) {
      setBlockedDelete({
        title: option.title,
        dependencies,
      });
      return;
    }

    resetDeleteOption();
    setOptionToDelete(option);
  };

  const confirmDelete = async () => {
    if (!serviceId || !optionToDelete) return;

    try {
      await deleteOptionAsync({
        optionId: optionToDelete.id,
        serviceId,
        supplierId,
        suppressErrorToast: true,
      });
      setOptionToDelete(null);
    } catch (error) {
      setOptionToDelete(null);
      setBlockedDelete({
        title: optionToDelete.title,
        dependencies: [],
        fallbackDescription: getErrorMessage(
          error,
          t("admin:errors.failedToDeleteOption")
        ),
      });
    }
  };

  const blockedDeleteDescription = blockedDelete?.fallbackDescription
    ? blockedDelete.fallbackDescription
    : t("admin:options.deleteBlockedDescription", {
        option: blockedDelete?.title ?? "",
        dependencies: blockedDelete?.dependencies.join(", ") ?? "",
      });

  return (
    <>
      <div className="flex flex-col gap-4 pt-4">
        <OptionsTabHeader
          onCreateOption={openCreateSheet}
          disabled={optionsLoading || Boolean(optionsError) || !serviceId}
        />

        {optionsLoading ? (
          <ServiceOptionsTabSkeleton />
        ) : optionsError ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-[6px] border border-border bg-white p-6 text-destructive">
            {t("admin:errors.failedToLoadServiceOptions")}
          </div>
        ) : options.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[6px] border border-border bg-white px-6 py-20">
            <div className="flex max-w-[669px] flex-col items-center gap-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-md bg-[var(--Background-Info-Subtle)]">
                <FileX className="size-6 text-[var(--Text-Info-Bold)]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-bold leading-8 tracking-normal text-neutral-900">
                  {t("admin:options.emptyTitle")}
                </h3>
                <p className="text-sm font-medium leading-6 text-neutral-600">
                  {t("admin:options.emptyDescription")}
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={openCreateSheet}
                disabled={!serviceId}
              >
                {t("admin:buttons.createOption")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[6px] border border-border-tertiary bg-white">
            <Table
              className={
                isScheduleService
                  ? "min-w-[1120px] table-fixed"
                  : "min-w-[840px] table-fixed"
              }
            >
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-border-primary bg-background-secondary hover:bg-background-secondary">
                  <TableHead className={`${headerCellClass} w-[220px]`}>
                    <SortableHeader<OptionsSortField>
                      label={t("admin:options.columns.optionName")}
                      field="title"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                      className="font-semibold text-text-primary hover:text-text-primary"
                    />
                  </TableHead>
                  {isScheduleService ? (
                    <>
                      {isFlightService ? (
                        <TableHead className={`${headerCellClass} w-[160px]`}>
                          <SortableHeader<OptionsSortField>
                            label={t("admin:options.columns.flightNumber")}
                            field="flightNumber"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                            className="font-semibold text-text-primary hover:text-text-primary"
                          />
                        </TableHead>
                      ) : null}
                      <TableHead className={`${headerCellClass} w-[160px]`}>
                        {t("admin:options.columns.schedule")}
                      </TableHead>
                      <TableHead className={`${headerCellClass} w-[160px]`}>
                        {t("admin:options.columns.days")}
                      </TableHead>
                    </>
                  ) : null}
                  <TableHead className={headerCellClass}>
                    {t("admin:labels.includes")}
                  </TableHead>
                  <TableHead className={headerCellClass}>
                    {t("admin:labels.excludes")}
                  </TableHead>
                  <TableHead
                    className={`${headerCellClass} w-[85px] pl-2 pr-4 text-right`}
                  >
                    {t("admin:labels.status")}
                  </TableHead>
                  <TableHead
                    className={`${headerCellClass} w-[115px] pl-2 pr-4 text-right`}
                  >
                    {t("admin:sections.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedOptions.map((option) => {
                  const dependencies =
                    dependenciesByOptionId.get(option.id) ?? [];
                  const deleteBlocked = dependencies.length > 0;
                  const operatingDays = optionOperatingDays(option);

                  return (
                    <TableRow
                      key={option.id}
                      className="min-h-9 border-border-tertiary bg-white hover:bg-white"
                    >
                      <TableCell
                        className={`${bodyCellClass} whitespace-normal`}
                      >
                        {option.title}
                      </TableCell>
                      {isScheduleService ? (
                        <>
                          {isFlightService ? (
                            <TableCell
                              className={`${bodyCellClass} whitespace-normal`}
                            >
                              {cellText(option.flightOption?.flightNumber)}
                            </TableCell>
                          ) : null}
                          <TableCell
                            className={`${bodyCellClass} whitespace-normal`}
                          >
                            {optionSchedule(option)}
                          </TableCell>
                          <TableCell className={bodyCellClass}>
                            {operatingDays.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {operatingDays.map((day) => (
                                  <span
                                    key={day}
                                    className="rounded-[4px] bg-border-secondary px-2.5 py-1 text-xs font-semibold leading-4 text-white"
                                  >
                                    {t(`admin:labels.weekdayShort.${day}`)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                        </>
                      ) : null}
                      <TableCell
                        className={`${bodyCellClass} whitespace-normal`}
                      >
                        {cellText(option.includes)}
                      </TableCell>
                      <TableCell
                        className={`${bodyCellClass} whitespace-normal`}
                      >
                        {cellText(option.excludes)}
                      </TableCell>
                      <TableCell
                        className={`${bodyCellClass} pl-2 pr-4 text-right`}
                      >
                        <div className="flex justify-end">
                          <Switch
                            size="sm"
                            checked={option.isActive}
                            loading={
                              isUpdatingOption && statusUpdatingId === option.id
                            }
                            onCheckedChange={(checked) =>
                              handleStatusChange(option, checked)
                            }
                            aria-label={t("admin:options.toggleStatusAria", {
                              option: option.title,
                            })}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border-tertiary p-0 text-right align-top last:border-r-0">
                        <div className="flex h-full min-h-9 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-full min-h-9 w-9 items-start rounded-none border-transparent pt-2"
                            onClick={() => openEditSheet(option)}
                            aria-label={t("admin:options.editAria", {
                              option: option.title,
                            })}
                          >
                            <SquarePen className="size-5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={
                              deleteBlocked
                                ? "h-full min-h-9 w-9 items-start rounded-none border-transparent pt-2 text-neutral-400 hover:border-transparent hover:text-neutral-400"
                                : "h-full min-h-9 w-9 items-start rounded-none border-transparent pt-2"
                            }
                            aria-disabled={deleteBlocked}
                            onClick={() => handleDeleteClick(option)}
                            aria-label={t("admin:options.deleteAria", {
                              option: option.title,
                            })}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {serviceId ? (
        <OptionSheet
          open={Boolean(sheetState)}
          mode={sheetState?.mode ?? "create"}
          option={sheetState?.mode === "edit" ? sheetState.option : null}
          serviceId={serviceId}
          supplierId={supplierId}
          serviceType={serviceTypeName}
          options={options}
          onOpenChange={(open) => {
            if (!open) setSheetState(null);
          }}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(optionToDelete)}
        onOpenChange={(open) => {
          if (!open) setOptionToDelete(null);
        }}
        title={t("admin:options.deleteTitle", {
          option: optionToDelete?.title ?? "",
        })}
        description={t("admin:options.deleteDescription", {
          option: optionToDelete?.title ?? "",
        })}
        confirmLabel={t("admin:buttons.deleteOption")}
        isPending={isDeletingOption}
        error={deleteError instanceof Error ? deleteError : null}
        defaultErrorMessage={t("admin:errors.failedToDeleteOption")}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <BlockedActionDialog
        open={Boolean(blockedDelete)}
        onOpenChange={(open) => {
          if (!open) setBlockedDelete(null);
        }}
        title={t("admin:options.deleteBlockedTitle")}
        description={blockedDeleteDescription}
      />
    </>
  );
}
