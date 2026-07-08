import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteAgencyForm } from "../model/useDeleteAgencyForm";

import type { Agency } from "@/entities/agency/model/types";
import { BlockedActionDialog, ConfirmDeleteDialog } from "@/shared/ui";

interface DeleteAgencyDialogProps {
  agency: Agency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgencyDialog({
  agency,
  open,
  onOpenChange,
}: DeleteAgencyDialogProps) {
  const { t } = useTranslation("admin");
  const { handleDelete, isPending, error, resetError } = useDeleteAgencyForm({
    agency,
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  if (!agency || !open) {
    return null;
  }

  const hasChildren = agency.agentsCount && agency.agentsCount > 0;

  if (hasChildren) {
    return (
      <BlockedActionDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("delete.reassignAgentsFirst")}
        description={t("delete.reassignAgentsFirstDescription")}
      />
    );
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.deleteAgency")}
      description={t("delete.deleteAgencyDescription")}
      confirmLabel={t("delete.deleteAgency")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteAgency")}
      onConfirm={handleDelete}
    />
  );
}
