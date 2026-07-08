import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Input,
  Switch,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { RatePlan } from "@/entities/service-option-rate-plan";
import {
  INITIAL_RATE_PLAN,
  useRatePlanForm,
} from "@/features/manage-service-option-rate-plans";
import { DatePickerGridInput, FormField } from "@/shared/ui";

interface CreateRatePlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  existingNames?: string[];
  onCreated?: (ratePlan: RatePlan) => void;
}

function DrawerDashedSeparator() {
  return (
    <div
      className="h-px w-full shrink-0 border-t border-dashed border-border-tertiary"
      aria-hidden
    />
  );
}

export function CreateRatePlanSheet({
  open,
  onOpenChange,
  serviceId,
  existingNames = [],
  onCreated,
}: CreateRatePlanSheetProps) {
  const { t } = useTranslation("admin");

  const isNameUnique = (name: string) =>
    !existingNames.some((n) => n.toLowerCase() === name.toLowerCase());

  const { form, handleSave, isSubmitting } = useRatePlanForm(
    null,
    serviceId,
    null,
    INITIAL_RATE_PLAN,
    {
      isNameUnique,
      onRatePlanCreated: (created) => {
        onCreated?.(created);
        onOpenChange(false);
      },
    }
  );

  useEffect(() => {
    if (!open) {
      form.reset(INITIAL_RATE_PLAN);
    }
  }, [open, form]);

  const payAtProperty = useStore(form.store, (s) => s.values.payAtProperty);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "fixed top-6 right-6 bottom-6 left-auto z-50 flex w-[362px] max-w-[362px] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl border border-border-tertiary p-0 shadow-[0px_4px_3px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.06)]",
          "data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-l border-border-tertiary bg-background-primary px-6 pb-4 pt-6">
          <DialogTitle className="text-lg font-bold leading-7 text-text-primary">
            {t("sections.createRatePlan")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6 shrink-0 p-0"
              aria-label={t("common:buttons.close")}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </DialogClose>
        </div>

        <DrawerDashedSeparator />

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-l border-border-tertiary bg-white p-6">
          <div className="flex flex-col gap-5">
            <FormField
              form={form}
              name="name"
              label={t("labels.ratePlanName")}
              required
            >
              {(field) => (
                <Input
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.enterRatePlanName")}
                  autoFocus
                  className={cn(
                    "h-9 bg-background-primary shadow-none",
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                form={form}
                name="validityDateFrom"
                label={t("labels.validityDateFrom")}
                required
              >
                {(field) => (
                  <DatePickerGridInput
                    value={field.state.value as string}
                    onChange={(v) => field.handleChange(v ?? "")}
                    placeholder={t("placeholders.selectStartDate")}
                    className={cn(
                      "h-9 bg-background-primary shadow-none",
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                )}
              </FormField>

              <FormField
                form={form}
                name="validityDateTo"
                label={t("labels.validityDateTo")}
              >
                {(field) => (
                  <DatePickerGridInput
                    value={(field.state.value as string | null) ?? ""}
                    onChange={(v) => field.handleChange(v ?? null)}
                    placeholder={t("placeholders.selectEndDate")}
                    className={cn(
                      "h-9 bg-background-primary shadow-none",
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                )}
              </FormField>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 whitespace-nowrap">
              <span className="shrink-0 text-sm font-medium leading-6 text-text-primary">
                {t("labels.payAtProperty")}
              </span>
              <Switch
                checked={payAtProperty}
                onCheckedChange={(v) => form.setFieldValue("payAtProperty", v)}
                aria-label={t("labels.payAtProperty")}
              />
            </div>
          </div>
        </div>

        <DrawerDashedSeparator />

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-l border-border-tertiary bg-background-primary px-6 py-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isLoading={isSubmitting}
            >
              {t("buttons.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
