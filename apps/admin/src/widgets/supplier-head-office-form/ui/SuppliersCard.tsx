import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "@sol/ui";
import { MoreVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

import type { Supplier } from "@/entities/suppliers/model/types";
import {
  AdminTable,
  type AdminTableColumn,
  type SortDirection,
} from "@/shared/components/Table";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import {
  ConfirmDeleteDialog,
  ActiveStatusSwitchWithXeroGate,
  CopyableCell,
  CopyableCellGroup,
} from "@/shared/ui";

interface SuppliersCardProps {
  /** When provided (edit mode), show table of suppliers. */
  suppliers?: Supplier[];
  /** Called when supplier name is clicked. */
  onSupplierNameClick?: (supplierId: string) => void;
  /** Called when a supplier's Active toggle is changed. */
  onToggleSupplierStatus?: (supplier: Supplier) => void;
  /** Called to delete (remove) a supplier from this head office. */
  onDeleteSupplier?: (
    supplier: Supplier,
    callbacks?: { onSuccess?: () => void }
  ) => void;
  /** Whether delete is available. */
  canDelete?: boolean;
  isDeletePending?: boolean;
  deleteError?: Error | null;
  resetDeleteError?: () => void;
}

function getSupplierSortValue(
  supplier: Supplier,
  key: string
): string | number | boolean {
  switch (key) {
    case "name":
      return (supplier.name ?? "").toLowerCase();
    case "email":
      return (supplier.email ?? "").toLowerCase();
    case "active":
      return supplier.isActive ? 1 : 0;
    default:
      return "";
  }
}

export function SuppliersCard({
  suppliers = [],
  onSupplierNameClick,
  onToggleSupplierStatus,
  onDeleteSupplier,
  canDelete = false,
  isDeletePending = false,
  deleteError = null,
  resetDeleteError,
}: SuppliersCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const hasSuppliers = suppliers.length > 0;
  const { suppliersStatus } = useLoadingStates(
    useShallow((state) => ({ suppliersStatus: state.suppliersStatus }))
  );
  const [sortKey, setSortKey] = useState<string | null>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );
  const deleteDialogOpen = supplierToDelete !== null;

  useEffect(() => {
    if (!deleteDialogOpen) {
      resetDeleteError?.();
    }
  }, [deleteDialogOpen, resetDeleteError]);

  const sortedSuppliers = useMemo(() => {
    if (!sortKey) return suppliers;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...suppliers].sort((a, b) => {
      const va = getSupplierSortValue(a, sortKey);
      const vb = getSupplierSortValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string")
        return dir * va.localeCompare(vb);
      if (typeof va === "number" && typeof vb === "number")
        return dir * (va - vb);
      if (typeof va === "boolean" && typeof vb === "boolean")
        return dir * (Number(va) - Number(vb));
      return 0;
    });
  }, [suppliers, sortKey, sortDirection]);

  const columns: AdminTableColumn<Supplier>[] = [
    {
      header: t("tableHeaders.supplier"),
      sortField: "name",
      headerClassName: "px-4",
      cell: (supplier) =>
        onSupplierNameClick ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-link font-normal hover:text-link/90"
            onClick={() => onSupplierNameClick(supplier.id)}
          >
            {supplier.name}
          </Button>
        ) : (
          supplier.name
        ),
      cellClassName: "px-4",
    },
    {
      header: t("tableHeaders.destination"),
      cell: (supplier) => (
        <span className="text-muted-foreground">
          {supplier.locationName ?? "—"}
        </span>
      ),
      cellClassName: "text-muted-foreground",
    },
    {
      header: t("tableHeaders.email"),
      headerClassName: "min-w-[85px] max-w-[190px]",
      sortField: "email",
      cell: (supplier) => (
        <CopyableCell
          value={supplier.email as string}
          cellId={`${supplier.id}-email`}
        />
      ),
      cellClassName: "max-w-0",
    },
    {
      header: t("tableHeaders.status"),
      headerClassName: "w-[90px] text-right",
      sortField: "active",
      sortableHeaderClassName: "w-full justify-end",
      cell: (supplier) => {
        const ariaLabel = t("aria.toggleActiveStatus", {
          name: supplier.name,
        });

        return (
          <div className="flex min-h-9 items-center justify-end">
            {onToggleSupplierStatus ? (
              <ActiveStatusSwitchWithXeroGate
                xeroId={supplier.xeroId}
                checked={supplier.isActive}
                onCheckedChange={() => onToggleSupplierStatus(supplier)}
                ariaLabel={ariaLabel}
                size="sm"
                loading={suppliersStatus[supplier.id]}
              />
            ) : (
              <Switch
                checked={supplier.isActive}
                disabled
                aria-label={ariaLabel}
                className="inline-flex"
              />
            )}
          </div>
        );
      },
      cellClassName: "text-end",
    },
    {
      header: t("table.actions"),
      headerClassName: "w-[72px] text-right",
      cell: (supplier) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t("aria.actionsFor", { name: supplier.name })}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onSupplierNameClick?.(supplier.id)}
            >
              {t("common:buttons.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={!canDelete}
              onClick={() => setSupplierToDelete(supplier)}
            >
              {t("common:buttons.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cellClassName: "text-end",
    },
  ];

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  return (
    <Card id="suppliers">
      <CardHeader className="pb-3">
        <CardTitle>{t("sections.suppliers")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("sections.headOfficeSuppliersDescription")}
        </p>
        {hasSuppliers ? (
          <CopyableCellGroup>
            <AdminTable<Supplier>
              data={sortedSuppliers}
              columns={columns}
              getRowKey={(row) => row.id}
              emptyMessage={t("empty.noSuppliersInHeadOffice")}
              striped
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </CopyableCellGroup>
        ) : null}
      </CardContent>

      {supplierToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => !open && setSupplierToDelete(null)}
          title={t("delete.deleteSupplier")}
          description={t("delete.deleteSupplierDescription", {
            name: supplierToDelete.name,
          })}
          confirmLabel={t("common:buttons.delete")}
          isPending={isDeletePending}
          error={deleteError}
          defaultErrorMessage={t("errors.failedToDeleteSupplier")}
          onConfirm={() =>
            onDeleteSupplier?.(supplierToDelete, {
              onSuccess: () => setSupplierToDelete(null),
            })
          }
        />
      )}
    </Card>
  );
}
