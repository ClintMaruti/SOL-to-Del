import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Commission } from "@/entities/commission";
import { ConfirmDeleteDialog } from "@/shared/ui";

import { useDeleteCommission } from "../api/useDeleteCommission";

interface DeleteCommissionDialogProps {
  commission: Commission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCommissionDialog({
  commission,
  open,
  onOpenChange,
}: DeleteCommissionDialogProps) {
  const { t } = useTranslation("admin");
  const {
    mutate: deleteCommission,
    isPending,
    reset: resetDeleteCommission,
  } = useDeleteCommission();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      resetDeleteCommission();
    }
  }, [open, resetDeleteCommission]);

  if (!commission || !open) {
    return null;
  }

  const handleDelete = () => {
    setError(null);

    deleteCommission(
      {
        agencyId: commission.agencyId,
        commissionId: commission.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (nextError) => {
          setError(
            nextError instanceof Error
              ? nextError
              : new Error(t("errors.failedToDeleteCommission"))
          );
        },
      }
    );
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("modals.deleteCommission")}
      description={t("delete.deleteCommissionDescription")}
      confirmLabel={t("common:buttons.delete")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteCommission")}
      onConfirm={handleDelete}
    />
  );
}
