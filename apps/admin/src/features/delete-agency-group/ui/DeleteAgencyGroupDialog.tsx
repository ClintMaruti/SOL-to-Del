import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { AgencyGroup } from "@/entities/agency-group/model/types";
import { BlockedActionDialog, ConfirmDeleteDialog } from "@/shared/ui";

import { useDeleteAgencyGroupForm } from "../model/useDeleteAgencyGroupForm";

interface DeleteAgencyGroupDialogProps {
  agencyGroup: AgencyGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgencyGroupDialog({
  agencyGroup,
  open,
  onOpenChange,
}: DeleteAgencyGroupDialogProps) {
  const { t } = useTranslation("admin");
  const { handleDelete, isPending, error, resetError } =
    useDeleteAgencyGroupForm({
      agencyGroup,
      onSuccess: () => {
        onOpenChange(false);
      },
    });

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  if (!agencyGroup || !open) {
    return null;
  }

  const hasAgencies = agencyGroup.numberOfAgencies > 0;

  if (hasAgencies) {
    return (
      <BlockedActionDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("delete.reassignAgenciesFirst")}
        description={t("delete.reassignAgenciesFirstDescription")}
      />
    );
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("modals.deleteAgencyGroup")}
      description={t("delete.deleteAgencyGroupDescription")}
      confirmLabel={t("modals.deleteAgencyGroup")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteAgencyGroup")}
      onConfirm={handleDelete}
    />
  );
}
