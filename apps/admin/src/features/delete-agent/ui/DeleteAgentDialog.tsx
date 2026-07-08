import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { Agent } from "@/entities/agent/model/types";
import { ConfirmDeleteDialog } from "@/shared/ui";

import { useDeleteAgentForm } from "../model/useDeleteAgentForm";

interface DeleteAgentDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgentDialog({
  agent,
  open,
  onOpenChange,
}: DeleteAgentDialogProps) {
  const { t } = useTranslation("admin");
  const { handleDelete, isPending, error, resetError } = useDeleteAgentForm({
    agent,
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  if (!agent || !open) {
    return null;
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("modals.deleteAgent")}
      description={t("delete.deleteAgentDescription")}
      confirmLabel={t("modals.deleteAgent")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteAgent")}
      onConfirm={handleDelete}
    />
  );
}
