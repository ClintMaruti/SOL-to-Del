import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useServiceOptions } from "@/entities/supplier-service-options";
import { useSupplierServices } from "@/entities/supplier-services";
import { DatePickerGridInput } from "@/shared/ui";
import { DropdownSelect } from "@/shared/ui/DropdownSelect";
import { FormField, FormMessage, VALIDATION_MESSAGES } from "@/shared/ui/form";

import { useCreateSupplierCloseout } from "../api/useCreateSupplierCloseout";
import { useCreateSupplierCloseoutForm } from "../model/useCreateSupplierCloseoutForm";

interface CreateSupplierCloseoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

export function CreateSupplierCloseoutModal({
  open,
  onOpenChange,
  supplierId,
}: CreateSupplierCloseoutModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: createCloseout,
    isPending,
    error: apiError,
    reset: resetMutation,
  } = useCreateSupplierCloseout();
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const { form } = useCreateSupplierCloseoutForm(
    (submitData) => {
      createCloseout(
        { supplierId, ...submitData },
        { onSuccess: () => onOpenChange(false) }
      );
    },
    (message) => setSchemaError(message)
  );

  const scope = useStore(form.store, (state) => state.values.scope);
  const selectedServiceId = useStore(
    form.store,
    (state) => state.values.serviceId
  );
  const isServiceScope = scope === "service";

  const { data: services = [] } = useSupplierServices(supplierId);
  const { data: options = [] } = useServiceOptions(
    isServiceScope ? selectedServiceId || null : null
  );

  const serviceDropdownOptions = useMemo(
    () =>
      services.map((service) => ({
        value: service.id,
        label: service.serviceName ?? service.name,
      })),
    [services]
  );

  const optionDropdownOptions = useMemo(
    () => options.map((option) => ({ value: option.id, label: option.title })),
    [options]
  );

  useEffect(() => {
    if (!open) {
      form.reset();
      setSchemaError(undefined);
      resetMutation();
    }
  }, [form, open, resetMutation]);

  const handleScopeChange = (value: string) => {
    if (value !== "supplier" && value !== "service") return;
    form.setFieldValue("scope", value);
    if (value === "supplier") {
      form.resetField("serviceId");
      form.resetField("serviceOptionId");
    }
  };

  const handleServiceChange = (
    value: string,
    field: { handleChange: (v: string) => void }
  ) => {
    field.handleChange(value);
    form.resetField("serviceOptionId");
  };

  const handleCancel = () => {
    form.reset();
    setSchemaError(undefined);
    resetMutation();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]! px-5 py-6">
        <DialogHeader className="gap-2">
          <DialogTitle>{t("admin:modals.createCloseout")}</DialogTitle>
          <DialogDescription>
            {t("admin:modals.createSupplierCloseoutDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSchemaError(undefined);
            form.handleSubmit();
          }}
          className="flex flex-col gap-3"
        >
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={handleScopeChange}
            variant="outline"
            spacing={0}
            className="grid h-9 w-full grid-cols-2"
          >
            <ToggleGroupItem
              value="supplier"
              className="h-9 w-full data-[state=on]:bg-brand-red data-[state=on]:text-white"
            >
              {t("admin:labels.supplier")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="service"
              className="h-9 w-full data-[state=on]:bg-brand-red data-[state=on]:text-white"
            >
              {t("admin:labels.service")}
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              form={form}
              name="travelDateFrom"
              label={t("admin:labels.from")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value
                    ? VALIDATION_MESSAGES.required(t("admin:labels.from"))
                    : undefined,
              }}
            >
              {(field) => (
                <DatePickerGridInput
                  id={field.name}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  placeholder={t("admin:placeholders.selectStartDate")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive",
                    "bg-white/70"
                  )}
                />
              )}
            </FormField>

            <FormField
              form={form}
              name="travelDateTo"
              label={t("admin:labels.to")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value
                    ? VALIDATION_MESSAGES.required(t("admin:labels.to"))
                    : undefined,
              }}
            >
              {(field) => (
                <DatePickerGridInput
                  id={field.name}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  placeholder={t("admin:placeholders.selectEndDate")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive",
                    "bg-white/70"
                  )}
                />
              )}
            </FormField>
          </div>

          {isServiceScope && (
            <>
              <FormField
                form={form}
                name="serviceId"
                label={t("admin:labels.service")}
                required
                validators={{
                  onChangeListenTo: ["scope"],
                  onSubmit: ({ value }: { value: string }) =>
                    !value
                      ? VALIDATION_MESSAGES.required(t("admin:labels.service"))
                      : undefined,
                }}
              >
                {(field) => (
                  <DropdownSelect
                    options={serviceDropdownOptions}
                    value={field.state.value || undefined}
                    onValueChange={(value) => handleServiceChange(value, field)}
                    placeholder={t("admin:placeholders.selectService")}
                  />
                )}
              </FormField>

              <FormField
                form={form}
                name="serviceOptionId"
                label={t("admin:labels.option")}
              >
                {(field) => (
                  <DropdownSelect
                    options={optionDropdownOptions}
                    value={field.state.value || undefined}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder={t("admin:placeholders.selectOption")}
                    disabled={!selectedServiceId}
                  />
                )}
              </FormField>
            </>
          )}

          <FormField form={form} name="reason" label={t("admin:labels.reason")}>
            {(field) => (
              <Textarea
                id="reason"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("admin:placeholders.typeReason")}
                className="min-h-[60px] resize-y"
              />
            )}
          </FormField>

          {(apiError || schemaError) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <FormMessage
                message={
                  schemaError ??
                  getErrorMessage(
                    apiError,
                    t("admin:errors.failedToCreateCloseout")
                  )
                }
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
              className="bg-gray-200 hover:bg-gray-100"
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t("admin:buttons.createCloseout")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
