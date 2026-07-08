import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ConfigurationImpactWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfigurationImpactWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isPending = false,
}: ConfigurationImpactWarningDialogProps) {
  const { t } = useTranslation(["admin", "common"]);

  const handleCancel = () => {
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px] rounded-[12px] p-6 gap-6">
        <DialogHeader className="gap-4 text-left">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 p-2 rounded-[6px] bg-red-100/80 w-fit">
              <TriangleAlert className="size-6 text-red-600 shrink-0" />
            </div>
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("admin:modals.configurationImpactWarningTitle")}
              </DialogTitle>
              <div className="flex flex-col gap-1.5 text-sm">
                <p className="text-muted-foreground font-medium leading-6">
                  {t("admin:modals.configurationImpactWarningDescription")}
                </p>
                <p className="text-foreground font-semibold leading-6">
                  {t("admin:modals.configurationImpactWarningNote")}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isPending}
            className="bg-gray-200 hover:bg-gray-300 text-foreground font-semibold"
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            isLoading={isPending}
            className="font-medium"
          >
            {t("admin:modals.configurationImpactWarningConfirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
