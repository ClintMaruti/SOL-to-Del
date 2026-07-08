import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { SupplierService } from "@/entities/supplier-services";
import { ConfirmDeleteDialog } from "@/shared/ui";

import { useDeleteSupplierServiceForm } from "../model/useDeleteSupplierServiceForm";

interface DeleteSupplierServiceDialogProps {
  supplierService: SupplierService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSupplierServiceDialog({
  supplierService,
  open,
  onOpenChange,
}: DeleteSupplierServiceDialogProps) {
  const { t } = useTranslation("admin");
  const { handleDelete, isPending, error, resetError } =
    useDeleteSupplierServiceForm({
      supplierService,
      onSuccess: () => {
        onOpenChange(false);
      },
    });

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  if (!supplierService || !open) {
    return null;
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.deleteService")}
      description={t("delete.deleteServiceDescription")}
      confirmLabel={t("delete.deleteService")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteSupplierService")}
      onConfirm={handleDelete}
    />
  );
}
