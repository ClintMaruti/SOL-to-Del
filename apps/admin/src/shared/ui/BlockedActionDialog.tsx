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

export interface BlockedActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

export function BlockedActionDialog({
  open,
  onOpenChange,
  title,
  description,
}: BlockedActionDialogProps) {
  const { t } = useTranslation("common");
  const handleDismiss = () => {
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

        <div className="flex justify-start pt-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDismiss}
            className="text-sm font-medium text-white bg-brand-red hover:bg-brand-red/90"
          >
            {t("buttons.ok")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
