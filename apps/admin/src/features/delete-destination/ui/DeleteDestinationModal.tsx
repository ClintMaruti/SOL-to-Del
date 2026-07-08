import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { Destination } from "@/entities/destination/model/types";
import { BlockedActionDialog, ConfirmDeleteDialog } from "@/shared/ui";

import { useDeleteDestinationForm } from "../model/useDeleteDestination";

interface DeleteDestinationModalProps {
  destination: Destination | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDestinationModal({
  destination,
  open,
  onOpenChange,
}: DeleteDestinationModalProps) {
  const { t } = useTranslation("admin");
  const { handleDelete, isPending, error, resetError } =
    useDeleteDestinationForm({
      destination,
      onSuccess: () => {
        onOpenChange(false);
      },
    });

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  if (!destination || !open) {
    return null;
  }

  const hasChildren = destination.children && destination.children.length > 0;

  if (hasChildren) {
    return (
      <BlockedActionDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("delete.deleteChildLocationsFirst")}
        description={t("delete.deleteChildLocationsFirstDescription")}
      />
    );
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("modals.deleteDestination")}
      description={t("delete.deleteDestinationDescription")}
      confirmLabel={t("modals.deleteDestination")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteDestination")}
      onConfirm={handleDelete}
    />
  );
}
