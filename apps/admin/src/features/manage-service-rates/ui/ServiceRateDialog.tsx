import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sol/ui";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ServiceRate } from "@/entities/service-rate";

import type { ServiceRateFormValues } from "../model/schema";
import { useServiceRateForm } from "../model/useServiceRateForm";
import { ServiceRateFormFields } from "./ServiceRateFormFields";

interface ServiceRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  rate?: ServiceRate | null;
  /** Prefill create form (e.g. duplicate rate identity). */
  initialValues?: ServiceRateFormValues;
  title: string;
}

export function ServiceRateDialog({
  open,
  onOpenChange,
  serviceId,
  rate,
  initialValues,
  title,
}: ServiceRateDialogProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { form, isPending } = useServiceRateForm({
    open,
    serviceId,
    rate,
    initialValues,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-[460px] flex-col gap-0 p-0 sm:max-w-[460px]"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-dashed border-border-tertiary bg-background-primary px-6 py-6">
          <DialogTitle className="text-lg font-bold text-foreground">
            {title}
          </DialogTitle>
          <button
            type="button"
            className="rounded-sm opacity-70 hover:opacity-100"
            onClick={() => onOpenChange(false)}
            aria-label={t("common:buttons.close")}
          >
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
            <ServiceRateFormFields form={form} />
          </div>

          <div className="flex justify-end gap-4 border-t border-dashed border-border-tertiary bg-background-primary px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t("common:buttons.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
