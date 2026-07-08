import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { MarginRule } from "@/entities/margin-rule";
import { ConfirmDeleteDialog } from "@/shared/ui";

import { useDeleteMarginRule } from "../api/useDeleteMarginRule";

interface DeleteMarginRuleDialogProps {
  rule: MarginRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMarginRuleDialog({
  rule,
  open,
  onOpenChange,
}: DeleteMarginRuleDialogProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: deleteMarginRule,
    isPending,
    reset: resetDeleteMarginRule,
  } = useDeleteMarginRule();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      resetDeleteMarginRule();
    }
  }, [open, resetDeleteMarginRule]);

  if (!rule || !open) {
    return null;
  }

  const handleDelete = () => {
    setError(null);

    deleteMarginRule(
      {
        marginRuleId: rule.id,
        rule,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (nextError) => {
          setError(
            nextError instanceof Error
              ? nextError
              : new Error(t("errors.failedToDeleteMarginRule"))
          );
        },
      }
    );
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.deleteMarginRule")}
      description={t("delete.deleteMarginRuleDescription")}
      confirmLabel={t("common:buttons.delete")}
      isPending={isPending}
      error={error}
      defaultErrorMessage={t("errors.failedToDeleteMarginRule")}
      onConfirm={handleDelete}
    />
  );
}
