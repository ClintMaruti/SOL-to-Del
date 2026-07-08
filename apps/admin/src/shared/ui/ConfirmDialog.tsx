import {
  Button,
  type ButtonVariant,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  confirmVariant?: ButtonVariant;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isPending = false,
  onConfirm,
  confirmVariant = "primary",
}: ConfirmDialogProps) {
  const { t } = useTranslation(["common", "admin"]);
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px] rounded-[12px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm font-medium leading-6">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isPending}
          >
            {cancelLabel ?? t("buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isPending}
          >
            {confirmLabel ?? t("buttons.confirm", { defaultValue: "Confirm" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
