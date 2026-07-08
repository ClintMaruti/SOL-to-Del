import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteSupplierHeadOfficeForm } from "../model/useDeleteSupplierHeadOfficeForm";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";
import { BlockedActionDialog, ConfirmDeleteDialog } from "@/shared/ui";

interface DeleteSupplierHeadOfficeDialogProps {
  supplierHeadOffice: SupplierHeadOffice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSupplierHeadOfficeDialog({
  supplierHeadOffice,
  open,
  onOpenChange,
}: DeleteSupplierHeadOfficeDialogProps) {
  const { t } = useTranslation("admin");
  const { handleDelete, isPending, error, resetError } =
    useDeleteSupplierHeadOfficeForm({
      supplierHeadOffice,
      onSuccess: () => {
        onOpenChange(false);
      },
    });

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  if (!supplierHeadOffice || !open) {
    return null;
  }

  const hasChildren = supplierHeadOffice.suppliersCount > 0;

  if (hasChildren) {
    return (
      <BlockedActionDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("delete.reassignSuppliersFirst")}
        description={t("delete.reassignSuppliersFirstHeadOfficeDescription")}
      />
    );
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.deleteHeadOffice")}
      description={t("delete.deleteHeadOfficeDescription")}
      confirmLabel={t("delete.deleteHeadOffice")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteSupplierHeadOffice")}
      onConfirm={handleDelete}
    />
  );
}
