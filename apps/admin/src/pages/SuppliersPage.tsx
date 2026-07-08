import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  useDeleteSupplier,
  useToggleSupplierStatus,
} from "@/entities/suppliers";
import type { Supplier } from "@/entities/suppliers/model/types";
import { useOpenStateWithCleanupOnClose } from "@/shared/hooks";
import { ROUTES, supplierDetailPath } from "@/shared/lib/paths";
import { hasSupplierXeroId } from "@/shared/lib/supplierXeroId";
import { ConfirmDeleteDialog } from "@/shared/ui";
import { SupplierList } from "@/widgets/supplier-list";

export function SuppliersPage() {
  const { t } = useTranslation(["admin", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headOfficeId = searchParams.get("headOfficeId");
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<Error | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useOpenStateWithCleanupOnClose(false, () => {
      setSupplierToDelete(null);
      setDeleteError(null);
    });

  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier();
  const { mutate: toggleSupplierStatus } = useToggleSupplierStatus();

  const handleCreateSupplier = () => {
    navigate(ROUTES.SUPPLIERS_CREATE);
  };

  const handleSupplierClick = (supplier: Supplier) => {
    navigate(supplierDetailPath(supplier.id));
  };

  const handleToggleStatus = (supplier: Supplier, checked: boolean) => {
    if (checked && !hasSupplierXeroId(supplier.xeroId)) {
      return;
    }
    toggleSupplierStatus({
      supplierId: supplier.id,
      activate: checked,
    });
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = useCallback(() => {
    if (!supplierToDelete) return;

    setDeleteError(null);
    deleteSupplier(supplierToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err : new Error(String(err)));
      },
    });
  }, [supplierToDelete, deleteSupplier, setDeleteDialogOpen]);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="leading-10 text-neutral-900">
            {t("admin:pages.suppliers")}
          </h1>
          <p className="max-w-2xl leading-6 text-neutral-600 text-sm font-medium">
            {t("admin:pages.suppliersDescription")}
          </p>
        </div>
        <Button
          onClick={handleCreateSupplier}
          variant="primary"
          className="shrink-0"
        >
          <Plus />
          {t("common:buttons.create")}
        </Button>
      </div>

      <SupplierList
        headOfficeId={headOfficeId}
        onSupplierClick={handleSupplierClick}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        onCreateSupplier={handleCreateSupplier}
      />

      {supplierToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t("delete.deleteSupplier")}
          description={t("delete.deleteSupplierDescription", {
            name: supplierToDelete.name,
          })}
          onConfirm={handleConfirmDelete}
          isPending={isDeleting}
          error={deleteError}
          defaultErrorMessage={t("errors.failedToDeleteSupplier")}
        />
      )}
    </div>
  );
}
