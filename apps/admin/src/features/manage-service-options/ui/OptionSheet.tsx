import { getErrorMessage, getValidationErrors } from "@sol/api-client";
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  toast,
} from "@sol/ui";
import { X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  useCreateServiceOption,
  useUpdateServiceOption,
  type ServiceOption,
} from "@/entities/supplier-service-options";
import { UnsavedChangesDialog } from "@/shared/ui";

import {
  hasOptionFormErrors,
  toOptionFormErrors,
  type OptionFormFieldErrors,
} from "../model/apiValidationErrors";
import {
  buildCreateServiceOptionBody,
  buildUpdateServiceOptionPayload,
} from "../model/buildOptionMutationPayload";
import { serviceOptionToFormValues } from "../model/optionFormMappers";
import { INITIAL_OPTION_FORM, useOptionForm } from "../model/useOptionForm";

import { OptionForm } from "./OptionForm";

interface OptionSheetProps {
  open: boolean;
  mode: "create" | "edit";
  serviceId: string;
  supplierId: string | null;
  serviceType: string | undefined;
  option?: ServiceOption | null;
  options: ServiceOption[];
  onOpenChange: (open: boolean) => void;
  onSaved?: (option: ServiceOption) => void;
}

function optionTitleKey(title: string) {
  return title.trim().toLowerCase();
}

export function OptionSheet({
  open,
  mode,
  serviceId,
  supplierId,
  serviceType,
  option,
  options,
  onOpenChange,
  onSaved,
}: OptionSheetProps) {
  const { t } = useTranslation(["admin", "common"]);
  const initialValues = useMemo(
    () =>
      option
        ? serviceOptionToFormValues(option, serviceType)
        : INITIAL_OPTION_FORM,
    [option, serviceType]
  );
  const { form, isDirty, reset } = useOptionForm(initialValues);
  const [fieldErrors, setFieldErrors] = useState<OptionFormFieldErrors>({});
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const {
    mutateAsync: createOptionAsync,
    isPending: isCreating,
    reset: resetCreateOption,
  } = useCreateServiceOption();
  const {
    mutateAsync: updateOptionAsync,
    isPending: isUpdating,
    reset: resetUpdateOption,
  } = useUpdateServiceOption();
  const isPending = isCreating || isUpdating;
  const sheetTitle =
    mode === "edit"
      ? t("admin:modals.editOption")
      : t("admin:modals.createOption");

  useEffect(() => {
    if (!open) {
      resetCreateOption();
      resetUpdateOption();
      return;
    }

    reset(initialValues);
  }, [initialValues, open, reset, resetCreateOption, resetUpdateOption]);

  const clearFieldError = (field: keyof OptionFormFieldErrors) => {
    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const closeWithoutPrompt = () => {
    setFieldErrors({});
    resetCreateOption();
    resetUpdateOption();
    reset(initialValues);
    onOpenChange(false);
  };

  const requestClose = () => {
    if (isPending) {
      return;
    }
    if (isDirty) {
      setUnsavedDialogOpen(true);
      return;
    }
    closeWithoutPrompt();
  };

  const applyApiError = (error: unknown, fallback: string) => {
    const validation = getValidationErrors(error);
    if (validation) {
      const nextFieldErrors = toOptionFormErrors(validation.errors);
      if (hasOptionFormErrors(nextFieldErrors)) {
        setFieldErrors(nextFieldErrors);
        return;
      }
    }

    toast.error(getErrorMessage(error, fallback));
  };

  const hasDuplicateTitle = (title: string) => {
    const nextTitle = optionTitleKey(title);
    if (!nextTitle) {
      return false;
    }

    return options.some(
      (existing) =>
        existing.id !== option?.id &&
        optionTitleKey(existing.title) === nextTitle
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setFieldErrors({});
    await form.validateAllFields("submit");
    if (!form.state.isValid) {
      return;
    }

    const values = form.state.values;
    if (hasDuplicateTitle(values.title)) {
      setFieldErrors({
        title: t("admin:validation.optionTitleUnique"),
      });
      return;
    }

    try {
      if (mode === "edit") {
        if (!option) {
          return;
        }
        const payload = buildUpdateServiceOptionPayload(
          serviceType,
          values,
          option.id,
          option.version
        );
        const saved = await updateOptionAsync({
          optionId: option.id,
          serviceId,
          supplierId,
          payload,
          suppressErrorToast: true,
        });
        onSaved?.(saved);
        closeWithoutPrompt();
        return;
      }

      const body = buildCreateServiceOptionBody(serviceType, values);
      const created = await createOptionAsync({
        serviceId,
        supplierId,
        ...body,
        suppressErrorToast: true,
      });
      onSaved?.(created);
      closeWithoutPrompt();
    } catch (error) {
      applyApiError(
        error,
        mode === "edit"
          ? t("admin:errors.failedToUpdateOption")
          : t("admin:errors.failedToCreateOption")
      );
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            onOpenChange(true);
            return;
          }
          requestClose();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="top-6 right-6 bottom-6 h-auto w-[calc(100vw-48px)] max-w-[420px] gap-0 overflow-hidden rounded-[12px] border border-border bg-white p-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)] sm:w-[420px] sm:max-w-[420px]"
        >
          <SheetHeader className="h-[68px] shrink-0 flex-row items-center justify-between gap-3 border-b border-dashed border-border bg-[#f9fafb] px-6 py-0">
            <SheetTitle className="text-lg font-bold leading-7 tracking-normal text-neutral-900">
              {sheetTitle}
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 rounded-[6px] p-0 text-neutral-900"
              onClick={requestClose}
              aria-label={t("common:buttons.close")}
            >
              <X className="size-5" />
            </Button>
          </SheetHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit}
          >
            <div className="min-h-0 flex-1 overflow-y-auto bg-white p-6">
              <OptionForm
                form={form}
                serviceType={serviceType}
                htmlIdPrefix={`option-sheet-${mode}`}
                variant="sheet"
                fieldErrors={fieldErrors}
                onFieldChange={clearFieldError}
              />
            </div>
            <SheetFooter className="h-[68px] shrink-0 flex-row items-center justify-end gap-4 border-t border-dashed border-border bg-[#f9fafb] px-6 py-0">
              <Button
                type="button"
                variant="secondary"
                onClick={requestClose}
                disabled={isPending}
              >
                {t("common:buttons.cancel")}
              </Button>
              <Button type="submit" variant="primary" isLoading={isPending}>
                {t("common:buttons.save")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        onStay={() => setUnsavedDialogOpen(false)}
        onDiscard={() => {
          setUnsavedDialogOpen(false);
          closeWithoutPrompt();
        }}
      />
    </>
  );
}
