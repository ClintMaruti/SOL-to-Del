import { ApiError, getErrorMessage } from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
  Input,
  Textarea,
  toast,
} from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useSupplierServices } from "@/entities/supplier-services";
import { supplierExtraDetailPath } from "@/shared/lib/paths";
import { DropdownMultiSelect } from "@/shared/ui";
import { FormField, FormMessage, VALIDATION_MESSAGES } from "@/shared/ui/form";

import { useCreateExtra } from "../api/useCreateExtra";
import { getServiceLabel } from "../lib/filter-services";
import { createExtraDefaultValues } from "../model/schema";
import { useCreateExtraForm } from "../model/useCreateExtraForm";

function isExtraTitleDuplicateError(error: unknown): boolean {
  if (!ApiError.isApiError(error)) return false;
  if (error.status === 409) return true;
  if (!error.isValidationError() || !error.validationErrors) return false;
  const ve = error.validationErrors;
  for (const key of Object.keys(ve)) {
    if (!/^title$/i.test(key)) continue;
    const msgs = ve[key];
    if (msgs?.some((m) => /unique/i.test(m))) return true;
  }
  return false;
}

interface CreateExtraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  /** When opened from the service Extras tab, pre-select this service. */
  defaultServiceId?: string;
}

export function CreateExtraModal({
  open,
  onOpenChange,
  supplierId,
  defaultServiceId,
}: CreateExtraModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const navigate = useNavigate();
  const {
    mutate: createExtra,
    isPending,
    reset: resetMutation,
  } = useCreateExtra();
  const { data: services = [], isLoading: servicesLoading } =
    useSupplierServices(supplierId ?? null);

  const [duplicateError, setDuplicateError] = useState(false);
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const { form } = useCreateExtraForm(
    (payload) => {
      setDuplicateError(false);
      setSchemaError(undefined);
      createExtra(
        { supplierId, ...payload },
        {
          onSuccess: (data) => {
            navigate(supplierExtraDetailPath(supplierId, data.id));
            onOpenChange(false);
          },
          onError: (error) => {
            if (isExtraTitleDuplicateError(error)) {
              setDuplicateError(true);
              return;
            }
            toast.error(
              getErrorMessage(error, t("admin:errors.failedToCreateExtra"))
            );
          },
        }
      );
    },
    (message) => setSchemaError(message)
  );

  useEffect(() => {
    if (!open) return;
    form.reset(createExtraDefaultValues);
    if (defaultServiceId) {
      form.setFieldValue("serviceIds", [defaultServiceId]);
    }
    setDuplicateError(false);
    setSchemaError(undefined);
    resetMutation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultServiceId]);

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        value: s.id,
        label: getServiceLabel(s),
        searchText: `${getServiceLabel(s)} ${s.name ?? ""} ${s.serviceName ?? ""}`,
      })),
    [services]
  );

  const handleCancel = () => {
    form.reset(createExtraDefaultValues);
    setDuplicateError(false);
    setSchemaError(undefined);
    resetMutation();
    onOpenChange(false);
  };

  const fieldErrorHighlight = duplicateError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px]! px-5 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900 leading-7">
            {t("admin:modals.createExtra")}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm leading-6 font-medium">
            {t("admin:modals.createExtraDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSchemaError(undefined);
            form.handleSubmit();
          }}
          className="space-y-2"
        >
          {duplicateError ? (
            <div
              className="flex gap-3 rounded-md bg-destructive/10 px-4 py-3 text-destructive"
              role="alert"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <div className="flex min-w-0 flex-col gap-0.5 text-destructive">
                <p className="text-sm font-bold leading-5 text-destructive">
                  {t("admin:modals.createExtraDuplicateTitle")}
                </p>
                <p className="text-sm font-medium leading-6 text-destructive">
                  {t("admin:modals.createExtraDuplicateDescription")}
                </p>
              </div>
            </div>
          ) : null}

          <FormField
            form={form}
            name="title"
            label={t("admin:labels.title")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) => {
                const trimmed = value.trim();
                if (!trimmed)
                  return VALIDATION_MESSAGES.required(t("admin:labels.title"));
                return undefined;
              },
            }}
          >
            {(field) => (
              <Input
                id="title"
                value={field.state.value}
                onChange={(e) => {
                  setDuplicateError(false);
                  field.handleChange(e.target.value);
                }}
                onBlur={field.handleBlur}
                aria-invalid={fieldErrorHighlight || !field.state.meta.isValid}
                className={cn(
                  (fieldErrorHighlight || field.state.meta.errors.length > 0) &&
                    "border-destructive bg-destructive/10"
                )}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="serviceIds"
            label={t("admin:labels.services")}
          >
            {(field) => (
              <DropdownMultiSelect
                id="serviceIds"
                options={serviceOptions}
                value={(field.state.value ?? []) as string[]}
                onValueChange={(next) => {
                  setDuplicateError(false);
                  field.handleChange(next);
                }}
                onBlur={field.handleBlur}
                isSearchable
                placeholder={t("admin:placeholders.selectServicesOptional")}
                searchPlaceholder={t("admin:placeholders.search")}
                emptyMessage={t("admin:empty.noServicesFound")}
                disabled={servicesLoading || services.length === 0}
                hasError={
                  fieldErrorHighlight || field.state.meta.errors.length > 0
                }
                className={cn(
                  (fieldErrorHighlight || field.state.meta.errors.length > 0) &&
                    "border-destructive bg-destructive/10"
                )}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="description"
            label={t("admin:labels.description")}
          >
            {(field) => (
              <Textarea
                id="description"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("admin:placeholders.extraDescription")}
                className="min-h-[60px] resize-y rounded-[6px]"
              />
            )}
          </FormField>

          {schemaError ? (
            <div className="rounded-md bg-destructive/10 p-3">
              <FormMessage message={schemaError} />
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {t("admin:buttons.saveAndConfigure")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
