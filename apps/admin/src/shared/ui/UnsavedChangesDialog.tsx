import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStay: () => void;
  onDiscard: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onStay,
  onDiscard,
  title,
  description,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation("common");
  const handleOpenChange = (next: boolean) => {
    if (!next) onStay();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[474px] gap-6"
        onPointerDownOutside={onStay}
      >
        <DialogHeader className="flex flex-row flex-wrap gap-4 gap-y-0 text-left sm:flex-row">
          <div
            className="flex mb-4 size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
            aria-hidden
          >
            <TriangleAlert className="size-5" />
          </div>
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-left">
              {title ?? t("dialogs.leavePageTitle")}
            </DialogTitle>
            <DialogDescription className="text-left">
              {description ?? t("dialogs.unsavedChangesDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onStay}
            className="bg-background-secondary"
          >
            {t("buttons.cancel")}
          </Button>
          {onDiscard && (
            <Button type="button" onClick={onDiscard}>
              {t("buttons.leaveWithoutSaving")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
