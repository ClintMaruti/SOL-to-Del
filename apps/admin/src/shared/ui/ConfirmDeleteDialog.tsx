import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  error?: Error | null;
  defaultErrorMessage?: string;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isPending = false,
  error,
  defaultErrorMessage,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation(["common", "admin"]);
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px] rounded-[12px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 mb-2">
            <TriangleAlert className="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle className="text-lg font-bold text-neutral-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm font-medium leading-6">
            {description}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? getErrorMessage(error)
                : (defaultErrorMessage ?? t("messages.failedToDelete"))}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isPending}
          >
            {t("buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isPending}
          >
            {confirmLabel ?? t("buttons.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
