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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getAllDestinationTypes,
  wouldCreateCircularParent,
} from "@/entities/destination/lib/destination-utils";
import type {
  Destination,
  DestinationType,
} from "@/entities/destination/model/types";
import { FormField, FormMessage, VALIDATION_MESSAGES } from "@/shared/ui/form";

import { useCreateDestination } from "../api/useCreateDestination";
import { useCreateDestinationForm } from "../model/useCreateDestination";

import { ParentDestinationDropdown } from "./ParentDestinationDropdown";

interface CreateDestinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: Destination[] | undefined;
  /** Optional parent destination to pre-select and lock the parent field */
  parentDestination?: Destination | null;
}

export function CreateDestinationModal({
  open,
  onOpenChange,
  destinations = [],
  parentDestination,
}: CreateDestinationModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: createDestination,
    isPending,
    error: apiError,
    reset: resetMutation,
  } = useCreateDestination();
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const { form } = useCreateDestinationForm(
    (submitData) => {
      createDestination(submitData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    },
    (message) => setSchemaError(message)
  );

  // Subscribe to type for conditional rendering and derived state
  const type = useStore(form.store, (state) => state.values.type);
  const isParentOptional = type === "Country";
  const isParentLocked = !!parentDestination;

  const destinationTypes = getAllDestinationTypes();

  // Initialize form with parent destination when modal opens
  useEffect(() => {
    if (open && parentDestination) {
      form.setFieldValue("parentId", parentDestination.id);
      form.setFieldValue("type", "Region");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentDestination?.id]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSchemaError(undefined);
      resetMutation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onDestinationTypeChange = (value: string) => {
    if (!value) return;
    const newType = value as DestinationType;
    const values = form.state.values;

    // Preserve code value when switching types
    if (newType === "Airport" && values.destinationCode) {
      form.setFieldValue("iataCode", values.destinationCode);
    } else if (values.type === "Airport" && values.iataCode) {
      form.setFieldValue("destinationCode", values.iataCode);
    }

    form.setFieldValue("type", newType);

    if (newType !== "Country") {
      form.setFieldValue("isPreferred", false);
    }

    // Clear parent when switching to Country (only if parent is not locked)
    if (!isParentLocked && ["Country"].includes(newType)) {
      form.setFieldValue("parentId", "");
    }
  };

  const handleCancel = () => {
    form.reset();
    setSchemaError(undefined);
    resetMutation();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px]! px-5 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900 leading-7">
            {t("modals.createNewDestination")}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm leading-6 font-medium">
            {t("modals.createDestinationDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSchemaError(undefined);
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Type Field */}
          <form.Field name="type">
            {(typeField) => (
              <div className="space-y-2">
                <Label htmlFor="type">
                  {t("labels.type")}
                  <span className="text-destructive">*</span>
                </Label>
                <ToggleGroup
                  type="single"
                  value={typeField.state.value}
                  onValueChange={onDestinationTypeChange}
                  variant="outline"
                  className="w-full bg-gray-50"
                >
                  {destinationTypes.map(
                    ({ type: dtype, icon: Icon, color }) => {
                      const isDisabled = isParentLocked && dtype === "Country";
                      return (
                        <ToggleGroupItem
                          key={dtype}
                          value={dtype}
                          disabled={isDisabled}
                          className={cn(
                            "flex items-center justify-center gap-0 border-none font-semibold text-brand-primary text-sm px-3 py-2",
                            typeField.state.value === dtype && "bg-slate-200!",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Icon className={cn("text-base mr-1", color)} />
                          <span>{dtype}</span>
                        </ToggleGroupItem>
                      );
                    }
                  )}
                </ToggleGroup>
              </div>
            )}
          </form.Field>

          {/* Name Field */}
          <FormField
            form={form}
            name="name"
            label={t("labels.name")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value.trim()
                  ? VALIDATION_MESSAGES.required(t("labels.name"))
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

          {/* Parent Destination Field */}
          <form.Field
            name="parentId"
            validators={{
              onChangeListenTo: ["type"],
              onSubmit: ({ value }: { value: string }) => {
                const currentType = form.getFieldValue("type");
                if (!["Country"].includes(currentType) && !value) {
                  return VALIDATION_MESSAGES.required(
                    t("labels.parentDestination")
                  );
                }
                if (value && wouldCreateCircularParent(destinations, value)) {
                  return t("errors.circularParent");
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <ParentDestinationDropdown
                destinations={destinations}
                parentDestination={parentDestination}
                field={field}
                isParentOptional={isParentOptional}
              />
            )}
          </form.Field>

          {/* IATA Code Field — Only for Airport type */}
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

          {/* Destination Code Field — Hidden for Airport type */}
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

          {/* Coordinates Fields */}
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
                    return VALIDATION_MESSAGES.latitude;
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
                    return VALIDATION_MESSAGES.longitude;
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
                    id="create-destination-preferred"
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v === true)}
                    aria-label={t("aria.preferredDestinationCheckbox")}
                  />
                  <Label
                    htmlFor="create-destination-preferred"
                    className="text-sm font-medium text-neutral-900 cursor-pointer"
                  >
                    {t("labels.preferredDestination")}
                  </Label>
                </div>
              )}
            </form.Field>
          )}

          {/* Error Display */}
          {(apiError || schemaError) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <FormMessage
                message={
                  schemaError ??
                  getErrorMessage(
                    apiError,
                    t("errors.failedToCreateDestination")
                  )
                }
              />
            </div>
          )}

          {/* Footer Buttons */}
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
              {t("buttons.createDestination")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
