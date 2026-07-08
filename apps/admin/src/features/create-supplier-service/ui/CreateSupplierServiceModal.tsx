import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  getDestinationChildrenUnderCountry,
  type Destination,
} from "@/entities/destination";
import type { DestinationType } from "@/entities/destination/model/types";
import { useServiceTypes } from "@/entities/service-type";
import { useSupplier } from "@/entities/suppliers";
import { buildHierarchicalLocationOptionsFromDestinationTree } from "@/shared/lib/location-options";
import { supplierServiceDetailPath } from "@/shared/lib/paths";
import { DropdownSelect } from "@/shared/ui";
import { FormField, FormMessage, VALIDATION_MESSAGES } from "@/shared/ui/form";

import { useCreateSupplierService } from "../api/useCreateSupplierService";
import {
  hasFromToFields,
  hasLocationField,
  isToFieldRequired,
} from "../model/schema";
import { useCreateSupplierServiceForm } from "../model/useCreateSupplierServiceForm";

type CreateServiceSubmitIntent = "continue" | "addAnother";

interface CreateSupplierServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  destinations?: Destination[];
}

export function CreateSupplierServiceModal({
  open,
  onOpenChange,
  supplierId,
  destinations = [],
}: CreateSupplierServiceModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: createSupplierService,
    isPending,
    error: apiError,
    reset: resetMutation,
  } = useCreateSupplierService();
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: supplierDetail } = useSupplier(supplierId);
  const supplierDefaultLocationId =
    supplierDetail?.locationId?.trim() || undefined;
  const [schemaError, setSchemaError] = useState<string | undefined>();
  const navigate = useNavigate();
  const submitIntentRef = useRef<CreateServiceSubmitIntent>("continue");

  const { form } = useCreateSupplierServiceForm(
    (submitData) => {
      const intent = submitIntentRef.current;
      createSupplierService(
        { ...submitData, supplierId },
        {
          onSuccess: (data) => {
            if (intent === "continue") {
              navigate(supplierServiceDetailPath(supplierId, data.id));
            } else {
              form.reset();
              setSchemaError(undefined);
              resetMutation();
            }
          },
        }
      );
    },
    (message) => setSchemaError(message)
  );

  const serviceTypeName = useStore(
    form.store,
    (state) => state.values.serviceTypeName
  );
  const showLocation = hasLocationField(serviceTypeName);
  const showFromTo = hasFromToFields(serviceTypeName);
  const toRequired = isToFieldRequired(serviceTypeName);

  useEffect(() => {
    if (!open) {
      form.reset();
      setSchemaError(undefined);
      resetMutation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCancel = () => {
    form.reset();
    setSchemaError(undefined);
    resetMutation();
    onOpenChange(false);
  };

  const supplierCountryDestinations = useMemo(() => {
    if (!supplierDetail?.countryId) return destinations;
    return getDestinationChildrenUnderCountry(
      destinations,
      supplierDetail.countryId
    );
  }, [destinations, supplierDetail?.countryId]);

  const hierarchicalLocationOptions =
    buildHierarchicalLocationOptionsFromDestinationTree(
      supplierCountryDestinations
    );

  const airportType: DestinationType = "Airport";
  const airportOptions = hierarchicalLocationOptions.filter(
    (loc) => loc.type === airportType
  );
  const nonAirportOptions = hierarchicalLocationOptions.filter(
    (loc) => loc.type !== airportType
  );

  const handleServiceTypeChange = useCallback(
    (selectedId: string) => {
      const selectedType = serviceTypes.find((st) => st.id === selectedId);
      const typeName = selectedType?.name.toLowerCase() ?? "";

      form.setFieldValue("serviceTypeId", selectedId);
      form.setFieldValue("serviceTypeName", typeName);

      if (!hasLocationField(typeName)) {
        form.setFieldValue("locationId", "");
      }
      if (!hasFromToFields(typeName)) {
        form.setFieldValue("fromLocationId", "");
        form.setFieldValue("toLocationId", "");
      }

      if (hasLocationField(typeName)) {
        const current = form.getFieldValue("locationId");
        if (!current && supplierDefaultLocationId) {
          form.setFieldValue("locationId", supplierDefaultLocationId);
        }
      }
    },
    [form, serviceTypes, supplierDefaultLocationId]
  );

  useEffect(() => {
    if (!open) return;
    if (!hasLocationField(serviceTypeName)) return;
    const current = form.getFieldValue("locationId");
    if (current) return;
    if (supplierDefaultLocationId) {
      form.setFieldValue("locationId", supplierDefaultLocationId);
    }
  }, [open, serviceTypeName, supplierDefaultLocationId, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px]! px-5 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900 leading-7">
            {t("admin:modals.createService")}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm leading-6 font-medium">
            {t("admin:modals.createServiceDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSchemaError(undefined);
            submitIntentRef.current = "continue";
            form.handleSubmit();
          }}
          className="space-y-2"
        >
          {/* Service Name */}
          <FormField
            form={form}
            name="name"
            label={t("admin:labels.serviceName")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) => {
                const trimmed = value.trim();
                if (!trimmed)
                  return VALIDATION_MESSAGES.required(
                    t("admin:labels.serviceName")
                  );
                if (trimmed.length < 3)
                  return t("admin:validation.fieldMinLength", {
                    field: t("admin:labels.serviceName"),
                    min: 3,
                  });
                if (trimmed.length > 64)
                  return t("admin:validation.fieldMaxLength", {
                    field: t("admin:labels.serviceName"),
                    max: 64,
                  });
                return undefined;
              },
            }}
          >
            {(field) => (
              <Input
                id="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("admin:placeholders.enterServiceName")}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>

          {/* Alternative Name */}
          <FormField
            form={form}
            name="alternativeName"
            label={t("admin:labels.alternativeName")}
          >
            {(field) => (
              <Input
                id="alternativeName"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("admin:placeholders.enterAlternativeName")}
              />
            )}
          </FormField>

          {/* Service Type */}
          <FormField
            form={form}
            name="serviceTypeId"
            label={t("admin:labels.serviceType")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value
                  ? VALIDATION_MESSAGES.required(t("admin:labels.serviceType"))
                  : undefined,
            }}
          >
            {(field) => (
              <Select
                value={field.state.value}
                onValueChange={handleServiceTypeChange}
              >
                <SelectTrigger id="serviceTypeId" className="w-full">
                  <SelectValue
                    placeholder={t("admin:placeholders.selectServiceType")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          {/* Location — Accommodation, Activity, Fee */}
          {showLocation && (
            <FormField
              form={form}
              name="locationId"
              label={t("admin:labels.location")}
            >
              {(field) => (
                <DropdownSelect
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v)}
                  options={nonAirportOptions}
                  isHierarchical
                  isSearchable
                  placeholder={t("admin:placeholders.selectLocation")}
                  searchPlaceholder={t("admin:placeholders.searchLocations")}
                  emptyMessage={t("admin:empty.noLocationsMatchingCountry")}
                  searchAriaLabel={t("admin:placeholders.searchLocations")}
                />
              )}
            </FormField>
          )}

          {/* From / To — Flight, Transportation */}
          {showFromTo && (
            <div className="grid grid-cols-2 gap-2">
              <FormField
                form={form}
                name="fromLocationId"
                label={t("admin:labels.from")}
                required
                validators={{
                  onChangeListenTo: ["serviceTypeId"],
                  onSubmit: ({ value }: { value: string }) => {
                    const typeName = form.getFieldValue("serviceTypeName");
                    if (hasFromToFields(typeName) && !value)
                      return VALIDATION_MESSAGES.required(
                        t("admin:labels.from")
                      );
                    return undefined;
                  },
                }}
              >
                {(field) => {
                  const options = toRequired
                    ? airportOptions
                    : nonAirportOptions;
                  return (
                    <DropdownSelect
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      options={options}
                      isHierarchical
                      isSearchable
                      placeholder={t("admin:placeholders.selectLocation")}
                      searchPlaceholder={t(
                        "admin:placeholders.searchLocations"
                      )}
                      emptyMessage={
                        toRequired
                          ? t("admin:empty.noAirportsMatchingCountry")
                          : t("admin:empty.noLocationsMatchingCountry")
                      }
                      searchAriaLabel={t("admin:placeholders.searchLocations")}
                    />
                  );
                }}
              </FormField>

              <FormField
                form={form}
                name="toLocationId"
                label={t("admin:labels.to")}
                required={toRequired}
                validators={{
                  onChangeListenTo: ["serviceTypeId"],
                  onSubmit: ({ value }: { value: string }) => {
                    const typeName = form.getFieldValue("serviceTypeName");
                    if (isToFieldRequired(typeName) && !value)
                      return VALIDATION_MESSAGES.required(t("admin:labels.to"));
                    return undefined;
                  },
                }}
              >
                {(field) => {
                  const options = toRequired
                    ? airportOptions
                    : nonAirportOptions;
                  return (
                    <DropdownSelect
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      options={options}
                      isHierarchical
                      isSearchable
                      placeholder={t("admin:placeholders.selectLocation")}
                      searchPlaceholder={t(
                        "admin:placeholders.searchLocations"
                      )}
                      emptyMessage={
                        toRequired
                          ? t("admin:empty.noAirportsMatchingCountry")
                          : t("admin:empty.noLocationsMatchingCountry")
                      }
                      searchAriaLabel={t("admin:placeholders.searchLocations")}
                    />
                  );
                }}
              </FormField>
            </div>
          )}

          {/* Description */}
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
                placeholder={t("admin:placeholders.serviceDescription")}
                className="min-h-[88px] resize-y"
              />
            )}
          </FormField>

          {/* Error Display */}
          {(apiError || schemaError) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <FormMessage
                message={
                  schemaError ??
                  getErrorMessage(
                    apiError,
                    t("admin:errors.failedToCreateSupplierService")
                  )
                }
              />
            </div>
          )}

          {/* Footer Buttons: Cancel left; Save & Continue + Save side by side on the right */}
          <div className="flex items-end justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
              className="bg-gray-200 hover:bg-gray-100"
            >
              {t("common:buttons.cancel")}
            </Button>
            <div className="flex flex-row flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                isLoading={isPending}
                disabled={isPending}
                onClick={() => {
                  setSchemaError(undefined);
                  submitIntentRef.current = "continue";
                  form.handleSubmit();
                }}
              >
                {t("admin:buttons.saveAndContinue")}
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setSchemaError(undefined);
                  submitIntentRef.current = "addAnother";
                  form.handleSubmit();
                }}
              >
                {t("common:buttons.save")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
