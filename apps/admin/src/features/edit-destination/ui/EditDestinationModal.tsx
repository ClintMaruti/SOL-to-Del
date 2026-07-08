import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDestination } from "@/entities/destination/api/useDestination";
import {
  findParentDestination,
  getAllDestinationTypes,
} from "@/entities/destination/lib/destination-utils";
import type {
  Destination,
  DestinationType,
} from "@/entities/destination/model/types";
import { FormField, FormMessage } from "@/shared/ui/form";

import { useUpdateDestination } from "../api/useUpdateDestination";
import { useEditDestinationForm } from "../model/useEditDestination";

interface EditDestinationModalProps {
  destination: Destination | null;
  destinations: Destination[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDestinationModal({
  destination,
  destinations,
  open,
  onOpenChange,
}: EditDestinationModalProps) {
  const { t } = useTranslation("admin");
  const { data: destinationData, isLoading: isLoadingDestination } =
    useDestination(destination?.id || null);

  const {
    mutate: updateDestination,
    isPending,
    error: apiError,
    reset: resetMutation,
  } = useUpdateDestination();

  const { form, getSubmitData } = useEditDestinationForm(destination);
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const type = useStore(form.store, (state) => state.values.type);

  const parentDestination = destinationData?.parentId
    ? findParentDestination(destinations, destinationData.parentId)
    : null;
  const parentDisplayName =
    destinationData?.parentId === "root_id"
      ? "All Destinations"
      : parentDestination?.name || destinationData?.parentId || "-";

  const destinationTypes = getAllDestinationTypes();

  useEffect(() => {
    if (!open) {
      form.reset();
      resetMutation();
    }
  }, [open, form, resetMutation]);

  useEffect(() => {
    if (!open || !destinationData) {
      return;
    }
    if (typeof destinationData.isPreferred === "boolean") {
      form.setFieldValue("isPreferred", destinationData.isPreferred);
    }
  }, [open, destinationData, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSchemaError(undefined);
      resetMutation();
    }
    onOpenChange(nextOpen);
  };

  const onDestinationTypeChange = (value: string) => {
    if (!value) return;
    const newType = value as DestinationType;
    const values = form.state.values;

    if (newType === "Airport" && values.destinationCode) {
      form.setFieldValue("iataCode", values.destinationCode);
    } else if (values.type === "Airport" && values.iataCode) {
      form.setFieldValue("destinationCode", values.iataCode);
    }

    form.setFieldValue("type", newType);
    if (newType !== "Country") {
      form.setFieldValue("isPreferred", false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!destinationData) return;

    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid) return;

    const result = getSubmitData(destination!.id, destinationData.parentId);
    if (!result.success) {
      setSchemaError(result.message);
      return;
    }

    updateDestination(result.data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleCancel = () => {
    form.reset();
    setSchemaError(undefined);
    resetMutation();
    onOpenChange(false);
  };

  if (!destination) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[474px]! px-5 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900 leading-7">
            Edit Destination
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm leading-6 font-medium">
            You can change the name, code or coordinates only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <form.Field name="type">
            {(typeField) => (
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type<span className="text-destructive">*</span>
                </Label>
                <ToggleGroup
                  type="single"
                  value={typeField.state.value}
                  onValueChange={onDestinationTypeChange}
                  variant="outline"
                  className="w-full bg-gray-50"
                >
                  {destinationTypes.map(
                    ({ type: dtype, icon: Icon, color }) => (
                      <ToggleGroupItem
                        key={dtype}
                        value={dtype}
                        className={cn(
                          "flex items-center justify-center gap-0 border-none font-semibold text-brand-primary text-sm px-3 py-2",
                          typeField.state.value === dtype && "bg-slate-200!"
                        )}
                      >
                        <Icon className={cn("text-base mr-1", color)} />
                        <span>{dtype}</span>
                      </ToggleGroupItem>
                    )
                  )}
                </ToggleGroup>
              </div>
            )}
          </form.Field>

          <FormField
            form={form}
            name="name"
            label={t("labels.name")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value.trim()
                  ? t("validation.required", { field: t("labels.name") })
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                id="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("placeholders.enterDestinationName")}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>

          {/* Parent Destination Field (Read-only) */}
          <div className="space-y-2">
            <Label className="opacity-50" htmlFor="parent">
              {t("labels.parentDestination")}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="parent"
                value={
                  parentDisplayName === "Root"
                    ? "All Destinations"
                    : parentDisplayName
                }
                disabled
                readOnly
                className="bg-muted cursor-not-allowed pr-10"
              />
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {type === "Airport" && (
            <FormField form={form} name="iataCode" label={t("labels.iataCode")}>
              {(field) => (
                <Input
                  id="iataCode"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.enterIataCode")}
                />
              )}
            </FormField>
          )}

          {type !== "Airport" && (
            <FormField
              form={form}
              name="destinationCode"
              label={t("labels.destinationCode")}
            >
              {(field) => (
                <Input
                  id="destinationCode"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.enterDestinationCode")}
                />
              )}
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              form={form}
              name="latitude"
              label={t("labels.latitude")}
              validators={{
                onSubmit: ({ value }: { value: string }) => {
                  if (!value.trim()) return undefined;
                  const lat = parseFloat(value);
                  if (isNaN(lat) || lat < -90 || lat > 90) {
                    return t("validation.latitude");
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.exampleLatitude")}
                  aria-invalid={!field.state.meta.isValid}
                />
              )}
            </FormField>

            <FormField
              form={form}
              name="longitude"
              label={t("labels.longitude")}
              validators={{
                onSubmit: ({ value }: { value: string }) => {
                  if (!value.trim()) return undefined;
                  const lng = parseFloat(value);
                  if (isNaN(lng) || lng < -180 || lng > 180) {
                    return t("validation.longitude");
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.exampleLongitude")}
                  aria-invalid={!field.state.meta.isValid}
                />
              )}
            </FormField>
          </div>

          {type === "Country" && (
            <form.Field name="isPreferred">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-destination-preferred"
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v === true)}
                    aria-label={t("aria.preferredDestinationCheckbox")}
                  />
                  <Label
                    htmlFor="edit-destination-preferred"
                    className="text-sm font-medium text-neutral-900 cursor-pointer"
                  >
                    {t("labels.preferredDestination")}
                  </Label>
                </div>
              )}
            </form.Field>
          )}

          {(apiError || schemaError) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <FormMessage
                message={
                  schemaError ??
                  getErrorMessage(
                    apiError,
                    t("errors.failedToUpdateDestination")
                  )
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending || isLoadingDestination}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoadingDestination}
              isLoading={isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
