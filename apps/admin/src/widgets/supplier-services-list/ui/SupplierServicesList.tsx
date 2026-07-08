import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sol/ui";
import { FolderOutputIcon, ImportIcon, MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { useDestinations } from "@/entities/destination/api/useDestinations";
import {
  getServiceTypeConfig,
  useSupplierServices,
  useToggleSupplierServiceStatus,
  type ServiceTypeValue,
  type SupplierService,
} from "@/entities/supplier-services";
import { CreateSupplierServiceModal } from "@/features/create-supplier-service";
import { DeleteSupplierServiceDialog } from "@/features/delete-supplier-service";
import {
  SORTABLE_TABLE_HEAD_BUTTON_CLASS,
  SortIcon,
} from "@/shared/components/Table";
import {
  supplierServiceDetailPath,
  supplierServiceOptionsDetailSearch,
  supplierServiceRatesDetailSearch,
} from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { ConfirmDialog, TableLoadingSkeleton } from "@/shared/ui";

import { useSupplierServicesListSort } from "../model/useSupplierServicesListSort";
import { buildServiceTableRows } from "../model/useSupplierServicesWithOptions";

import { SupplierServicesListEmpty } from "./SupplierServicesListEmpty";

const CELL_BORDER = "border-r border-b border-border-tertiary";

interface SupplierServicesListProps {
  supplierId: string | undefined;
}

export function SupplierServicesList({
  supplierId,
}: SupplierServicesListProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] =
    useState<SupplierService | null>(null);
  const [serviceToToggle, setServiceToToggle] = useState<{
    service: SupplierService;
    targetActive: boolean;
  } | null>(null);
  /** Sync hover across `<tr>`s that share rowSpan cells on the first option row. */
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);

  const {
    data: services = [],
    isLoading,
    error,
  } = useSupplierServices(supplierId ?? null);
  const { data: destinations } = useDestinations();
  const { mutate: toggleStatus, isPending: isToggling } =
    useToggleSupplierServiceStatus();
  const { sortState, handleSort, sortedServices } =
    useSupplierServicesListSort(services);
  const { supplierServicesStatus } = useLoadingStates(
    useShallow((state) => ({
      supplierServicesStatus: state.supplierServicesStatus,
    }))
  );
  const tableRows = useMemo(
    () => buildServiceTableRows(sortedServices),
    [sortedServices]
  );

  const canRender = !isLoading && !error;

  if (!supplierId) {
    return null;
  }

  return (
    <div className="py-4">
      <ConfirmDialog
        open={!!serviceToToggle}
        onOpenChange={(open) => !open && setServiceToToggle(null)}
        title={
          !serviceToToggle?.targetActive
            ? t("modals.confirmActivateService")
            : t("modals.confirmDeactivateService")
        }
        description={
          !serviceToToggle?.targetActive
            ? t("modals.confirmActivateServiceDescription")
            : t("modals.confirmDeactivateServiceDescription", {
                name: serviceToToggle?.service.name ?? "",
              })
        }
        confirmLabel={
          !serviceToToggle?.targetActive
            ? t("buttons.activate")
            : t("buttons.deactivate")
        }
        isPending={isToggling}
        onConfirm={() => {
          if (!serviceToToggle) return;
          toggleStatus(
            {
              serviceId: serviceToToggle.service.id,
              supplierId: serviceToToggle.service.supplierId,
              isActive: serviceToToggle.targetActive,
            },
            { onSuccess: () => setServiceToToggle(null) }
          );
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base text-neutral-900 font-bold leading-6 mb-1">
            {t("sections.services")}
          </h2>
          <p className="text-sm text-neutral-600 font-medium leading-6">
            {t("sections.addServiceDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="lg"
            onClick={() => {}}
          >
            <FolderOutputIcon className="size-4" />
            {t("buttons.export")}
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            size="lg"
            onClick={() => {}}
          >
            <ImportIcon className="size-4" />
            {t("buttons.import")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
          >
            {t("buttons.createService")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton
          columns={["12", "18", "10", "10", "10", "12", "8"]}
        />
      ) : null}

      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadServices"))}
        </div>
      ) : null}

      {canRender && services.length === 0 ? (
        <SupplierServicesListEmpty
          onCreateService={() => setCreateModalOpen(true)}
        />
      ) : null}

      {canRender && services.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-background-primary">
              <TableRow>
                <TableHead className="pl-4 pr-2 w-[85px] border-r border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className={SORTABLE_TABLE_HEAD_BUTTON_CLASS}
                    onClick={() =>
                      handleSort(
                        "type",
                        sortState.field === "type" &&
                          sortState.direction === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                  >
                    {t("tableHeaders.type")}
                    <SortIcon
                      columnKey="type"
                      sortKey={sortState.field}
                      sortDirection={sortState.direction}
                    />
                  </Button>
                </TableHead>
                <TableHead className="border-r border-gray-200 min-w-[85px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className={SORTABLE_TABLE_HEAD_BUTTON_CLASS}
                    onClick={() =>
                      handleSort(
                        "serviceName",
                        sortState.field === "serviceName" &&
                          sortState.direction === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                  >
                    {t("tableHeaders.service")}
                    <SortIcon
                      columnKey="serviceName"
                      sortKey={sortState.field}
                      sortDirection={sortState.direction}
                    />
                  </Button>
                </TableHead>
                <TableHead className="text-right pr-0 border-r border-gray-200 w-[85px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className={SORTABLE_TABLE_HEAD_BUTTON_CLASS}
                    onClick={() =>
                      handleSort(
                        "isActive",
                        sortState.field === "isActive" &&
                          sortState.direction === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                  >
                    {t("tableHeaders.status")}
                    <SortIcon
                      columnKey="isActive"
                      sortKey={sortState.field}
                      sortDirection={sortState.direction}
                    />
                  </Button>
                </TableHead>
                <TableHead className="border-r border-gray-200">
                  {t("tableHeaders.options")}
                </TableHead>
                <TableHead className="border-r border-gray-200">
                  {t("tableHeaders.rates")}
                </TableHead>
                <TableHead className="border-r border-gray-200">
                  {t("tableHeaders.ratePlans")}
                </TableHead>
                <TableHead className="text-right w-[85px]">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => {
                const { service, option, isFirstOptionRow, optionCount } = row;
                const rowKey = option
                  ? `${service.id}-${option.id}`
                  : service.id;

                return (
                  <TableRow
                    key={rowKey}
                    data-service-row={service.id}
                    className={cn(
                      "bg-background",
                      hoveredServiceId === service.id && "bg-muted/50"
                    )}
                    onMouseEnter={() => setHoveredServiceId(service.id)}
                    onMouseLeave={(e) => {
                      const to = e.relatedTarget;
                      if (to instanceof Element) {
                        const toRow = to.closest("tr[data-service-row]");
                        if (
                          toRow?.getAttribute("data-service-row") === service.id
                        ) {
                          return;
                        }
                      }
                      setHoveredServiceId(null);
                    }}
                  >
                    {isFirstOptionRow && (
                      <>
                        <TableCell
                          rowSpan={optionCount}
                          className={cn(CELL_BORDER, "pl-4 pr-2 py-2 w-[85px]")}
                        >
                          <ServiceTypeIcon
                            serviceTypeName={
                              service.type?.toLowerCase() as ServiceTypeValue
                            }
                          />
                        </TableCell>
                        <TableCell
                          rowSpan={optionCount}
                          className={cn(CELL_BORDER, "pl-4 pr-2 py-2")}
                        >
                          <Link
                            to={supplierServiceDetailPath(
                              supplierId,
                              service.id
                            )}
                            className="text-blue-500 hover:underline font-medium text-left text-sm"
                          >
                            {service.serviceName ?? service.name}
                          </Link>
                        </TableCell>
                        <TableCell
                          rowSpan={optionCount}
                          className={cn(
                            CELL_BORDER,
                            "text-center pl-4 pr-2 py-2"
                          )}
                        >
                          <div className="flex items-center justify-end">
                            <Switch
                              checked={service.isActive}
                              onCheckedChange={() =>
                                setServiceToToggle({
                                  service,
                                  targetActive: service.isActive,
                                })
                              }
                              aria-label={t("aria.toggleActiveStatus", {
                                name: service.name,
                              })}
                              size="sm"
                              loading={supplierServicesStatus[service.id]}
                            />
                          </div>
                        </TableCell>
                      </>
                    )}

                    <TableCell className={cn(CELL_BORDER, "pl-4 pr-2 py-2")}>
                      {option ? (
                        <Link
                          to={supplierServiceOptionsDetailSearch(
                            supplierId,
                            service.id,
                            { optionId: option.id }
                          )}
                          className="text-blue-500 hover:underline text-sm font-medium"
                        >
                          {option.name}
                        </Link>
                      ) : null}
                    </TableCell>

                    <TableCell className={cn(CELL_BORDER, "pl-4 pr-2 py-2")}>
                      {isFirstOptionRow ? (
                        <div className="inline-flex flex-wrap gap-2">
                          {service.rates?.length > 0 ? (
                            service.rates.map((rate, index) => (
                              <Link
                                key={rate.id}
                                to={supplierServiceRatesDetailSearch(
                                  supplierId,
                                  service.id,
                                  { rateId: rate.id }
                                )}
                                className="text-blue-500 hover:underline text-sm font-medium"
                              >
                                {rate.rateName}
                                {index < service.rates.length - 1 ? "," : ""}
                              </Link>
                            ))
                          ) : (
                            <span className="text-sm font-medium text-gray-500">
                              {t("placeholders.dash")}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell className={cn(CELL_BORDER, "pl-4 pr-2 py-2")}>
                      <div className="inline-flex flex-wrap gap-2">
                        {option?.ratePlans?.length &&
                        option?.ratePlans?.length > 0 ? (
                          option?.ratePlans.map((ratePlan, index) => (
                            <Link
                              key={ratePlan.id}
                              to={supplierServiceOptionsDetailSearch(
                                supplierId,
                                service.id,
                                {
                                  optionId: option.id,
                                  innerTab: "ratePlan",
                                  ratePlanId: ratePlan.id,
                                }
                              )}
                              className="text-blue-500 hover:underline text-sm font-medium"
                            >
                              {ratePlan.ratePlanName}
                              {index < option?.ratePlans?.length - 1 ? "," : ""}
                            </Link>
                          ))
                        ) : (
                          <span className="text-sm font-medium text-gray-500">
                            {t("placeholders.dash")}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className={cn(
                        CELL_BORDER,
                        "text-right",
                        "border-r-0",
                        "px-2 py-1"
                      )}
                    >
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={t("aria.actionsFor", {
                                name: service.name,
                              })}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-sm shadow-none border-gray-200 px-1"
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setServiceToDelete(service)}
                              className="py-1.5 px-2 text-sm font-medium"
                            >
                              {t("common:buttons.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <CreateSupplierServiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        supplierId={supplierId}
        destinations={destinations}
      />

      <DeleteSupplierServiceDialog
        supplierService={serviceToDelete}
        open={!!serviceToDelete}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
      />
    </div>
  );
}

function ServiceTypeIcon({
  serviceTypeName,
}: {
  serviceTypeName: ServiceTypeValue;
}) {
  const config = getServiceTypeConfig(serviceTypeName);
  const Icon = config.icon;
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "flex items-center justify-center rounded-[6px] gap-2 py-2 px-1 w-6 h-6 border",
          config.borderColor,
          config.backgroundColor
        )}
      >
        <Icon className={cn("size-4", config.color)} />
      </div>
    </div>
  );
}
