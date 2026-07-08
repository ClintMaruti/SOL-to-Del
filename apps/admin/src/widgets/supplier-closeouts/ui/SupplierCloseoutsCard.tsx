import {
  Button,
  Card,
  CardContent,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sol/ui";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useSupplierCloseouts,
  useToggleSupplierCloseoutStatus,
  type SupplierCloseout,
} from "@/entities/supplier-closeout";
import { CreateSupplierCloseoutModal } from "@/features/create-supplier-closeout";
import { useDeleteSupplierCloseout } from "@/features/delete-supplier-closeout";
import { formatDate } from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { ConfirmDeleteDialog } from "@/shared/ui";

interface SupplierCloseoutsCardProps {
  supplierId: string;
}

function getServiceDisplay(closeout: SupplierCloseout): string {
  return closeout.serviceId ? closeout.serviceName || "-" : "-";
}

function getOptionDisplay(closeout: SupplierCloseout): string {
  if (!closeout.serviceId || !closeout.serviceOptionId) return "-";
  return closeout.serviceOptionName || "-";
}

function ReasonCell({ reason }: { reason: string | null }) {
  if (!reason) return <span>-</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block max-w-[220px] truncate">{reason}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <p>{reason}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface DeleteCloseoutButtonProps {
  disabled: boolean;
  label: string;
  tooltip: string;
  onClick: () => void;
}

function DeleteCloseoutButton({
  disabled,
  label,
  tooltip,
  onClick,
}: DeleteCloseoutButtonProps) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <Trash2 className="size-4 text-brand-red" />
    </Button>
  );

  if (!disabled) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[240px]">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SupplierCloseoutsCard({
  supplierId,
}: SupplierCloseoutsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const {
    data: closeouts = [],
    isLoading,
    error,
  } = useSupplierCloseouts(supplierId);
  const sortedCloseouts = useMemo(
    () =>
      [...closeouts].sort((a, b) =>
        b.travelDateFrom.localeCompare(a.travelDateFrom)
      ),
    [closeouts]
  );

  const {
    mutate: deleteCloseout,
    isPending: isDeletePending,
    reset: resetDeleteMutation,
  } = useDeleteSupplierCloseout();
  const { mutate: toggleCloseoutStatus } = useToggleSupplierCloseoutStatus();
  const closeoutsStatus = useLoadingStates((state) => state.closeoutsStatus);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCloseout(
      { supplierId, closeoutId: deleteTarget },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          resetDeleteMutation();
        },
      }
    );
  };

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
      resetDeleteMutation();
    }
  };

  const openCreateModal = () => setCreateModalOpen(true);

  return (
    <>
      <Card id="closeouts" className="rounded-[6px] border-0! shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-bold text-neutral-900 leading-6">
                  {t("admin:closeouts.title")}
                </h2>
                <p className="text-sm font-medium text-neutral-600 leading-6">
                  {t("admin:closeouts.subtitle")}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setCreateModalOpen(true)}>
                <Plus className="size-4" />
                {t("admin:closeouts.addCloseout")}
              </Button>
            </div>

            {error ? (
              <p className="text-sm font-medium text-destructive">
                {t("admin:errors.failedToLoadCloseouts")}
              </p>
            ) : sortedCloseouts.length > 0 ? (
              <div className="rounded-[6px] border border-border overflow-hidden">
                <Table aria-busy={isLoading}>
                  <TableHeader className="bg-gray-200">
                    <TableRow>
                      <TableHead className="w-[160px] pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 border-b border-r border-gray-300">
                        {t("admin:labels.from")}
                      </TableHead>
                      <TableHead className="w-[160px] pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 border-b border-r border-gray-300">
                        {t("admin:labels.to")}
                      </TableHead>
                      <TableHead className="pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 border-b border-r border-gray-300">
                        {t("admin:labels.service")}
                      </TableHead>
                      <TableHead className="pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 border-b border-r border-gray-300">
                        {t("admin:labels.option")}
                      </TableHead>
                      <TableHead className="pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 border-b border-r border-gray-300">
                        {t("admin:labels.reason")}
                      </TableHead>
                      <TableHead className="w-[85px] pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 text-right border-b border-r border-gray-300">
                        {t("admin:labels.status")}
                      </TableHead>
                      <TableHead className="w-[85px] pl-4 pr-2 py-1.5 min-h-[36px] font-semibold text-sm text-neutral-900 text-right border-b border-gray-300">
                        {t("table.action")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCloseouts.map((closeout) => (
                      <TableRow key={closeout.id}>
                        <TableCell className="w-[160px] pl-4 pr-2 py-1.5 text-sm text-neutral-600 border-b border-r border-gray-300 bg-gray-50">
                          <div className="flex items-center justify-between gap-2">
                            <span>{formatDate(closeout.travelDateFrom)}</span>
                            <Calendar className="size-4 text-neutral-500" />
                          </div>
                        </TableCell>
                        <TableCell className="w-[160px] pl-4 pr-2 py-1.5 text-sm text-neutral-600 border-b border-r border-gray-300 bg-gray-50">
                          <div className="flex items-center justify-between gap-2">
                            <span>{formatDate(closeout.travelDateTo)}</span>
                            <Calendar className="size-4 text-neutral-500" />
                          </div>
                        </TableCell>
                        <TableCell className="pl-4 pr-2 py-1.5 text-sm text-neutral-600 border-b border-r border-gray-300 bg-gray-50">
                          {getServiceDisplay(closeout)}
                        </TableCell>
                        <TableCell className="pl-4 pr-2 py-1.5 text-sm text-neutral-600 border-b border-r border-gray-300 bg-gray-50">
                          {getOptionDisplay(closeout)}
                        </TableCell>
                        <TableCell className="pl-4 pr-2 py-1.5 text-sm text-neutral-700 border-b border-r border-gray-300 bg-gray-50">
                          <ReasonCell reason={closeout.reason} />
                        </TableCell>
                        <TableCell className="w-[85px] pl-4 pr-2 py-1.5 border-b border-r border-gray-200">
                          <div className="flex justify-end">
                            <Switch
                              checked={closeout.isActive}
                              onCheckedChange={() =>
                                toggleCloseoutStatus({
                                  supplierId,
                                  closeoutId: closeout.id,
                                  isActive: closeout.isActive,
                                })
                              }
                              loading={closeoutsStatus[closeout.id]}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="w-[85px] pl-4 pr-2 py-1.5 border-b border-gray-200">
                          <div className="flex justify-end">
                            <DeleteCloseoutButton
                              disabled={closeout.isActive}
                              label={t("common:buttons.delete")}
                              tooltip={t(
                                "admin:closeouts.activeDeleteDisabledTooltip"
                              )}
                              onClick={() => setDeleteTarget(closeout.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-border px-6 py-12 text-center">
                <h3 className="text-base font-bold text-foreground leading-6">
                  {t("admin:closeouts.emptyTitle")}
                </h3>
                <p className="mt-1 max-w-md text-sm font-medium text-muted-foreground leading-6">
                  {t("admin:closeouts.emptyDescription")}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={openCreateModal}
                  className="mt-4"
                >
                  <Plus className="size-4" />
                  {t("admin:closeouts.addCloseout")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateSupplierCloseoutModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        supplierId={supplierId}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={handleDeleteDialogClose}
        title={t("admin:modals.confirmDeleteCloseout")}
        description={t("admin:modals.confirmDeleteCloseoutDescription")}
        confirmLabel={t("common:buttons.delete")}
        isPending={isDeletePending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
