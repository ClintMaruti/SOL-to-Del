import {
  getErrorMessage,
  getFieldError,
  getValidationErrors,
} from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  FieldGroup,
  Input,
  cn,
} from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAgencyGroups } from "@/entities/agency-group";
import {
  getTomorrowIsoDate,
  isMarginRuleActive,
  toLocalIsoDateString,
  type MarginRule,
  type MarginRuleModalMode,
} from "@/entities/margin-rule";
import { useServiceTypes } from "@/entities/service-type";
import { useSupplierServices } from "@/entities/supplier-services";
import { useSuppliers } from "@/entities/suppliers";
import {
  getServiceOptionLabel,
  getSupplierServiceLabel,
  matchesSelectedServiceType,
} from "@/shared/lib/catalog-service.utils";
import {
  DatePickerGridInput,
  DropdownSelect,
  type DropdownSelectOption,
} from "@/shared/ui";

import { useCreateMarginRule } from "../api/useCreateMarginRule";
import { useUpdateMarginRule } from "../api/useUpdateMarginRule";
import { isMarginRuleDuplicateError } from "../model/error";
import {
  buildMarginRuleCacheItem,
  getInitialMarginRuleFormValues,
  getMarginRuleFieldErrors,
  isMarginRuleFormLocked,
  toCreateMarginRulePayload,
  toUpdateMarginRulePayload,
} from "../model/form";
import {
  ANY_SCOPE_VALUE,
  CLEARED_MARGIN_RULE_FORM_VALUES,
  EMPTY_MARGIN_RULE_FORM_VALUES,
  type MarginRuleFieldErrors,
  type MarginRuleFieldName,
  type MarginRuleFormValues,
  type MarginRuleSubmitIntent,
} from "../model/types";

interface MarginRuleModalProps {
  open: boolean;
  mode: MarginRuleModalMode;
  rule?: MarginRule | null;
  onOpenChange: (open: boolean) => void;
  onSaveAndCreateSuccess?: () => void;
}

interface ModalAlertState {
  title: string;
  description?: string;
  variant: "duplicate" | "error";
}

function byLabelAsc(left: DropdownSelectOption, right: DropdownSelectOption) {
  return (left.label ?? "").localeCompare(right.label ?? "");
}

function toOption(
  value: string,
  label: string | null | undefined
): DropdownSelectOption {
  return { value, label: label ?? value };
}

function fieldErrorClassName(hasError: boolean) {
  return hasError ? "border-destructive bg-destructive/10" : undefined;
}

export function MarginRuleModal({
  open,
  mode,
  rule,
  onOpenChange,
  onSaveAndCreateSuccess,
}: MarginRuleModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: createMarginRule,
    isPending: isCreatingMarginRule,
    reset: resetCreateMarginRule,
  } = useCreateMarginRule();
  const {
    mutate: updateMarginRule,
    isPending: isUpdatingMarginRule,
    reset: resetUpdateMarginRule,
  } = useUpdateMarginRule();
  const agencyGroupsResult = useAgencyGroups();
  const serviceTypesResult = useServiceTypes();
  const suppliersResult = useSuppliers();
  const [values, setValues] = useState<MarginRuleFormValues>(
    EMPTY_MARGIN_RULE_FORM_VALUES
  );
  const [fieldErrors, setFieldErrors] = useState<MarginRuleFieldErrors>({});
  const [alert, setAlert] = useState<ModalAlertState | null>(null);
  const shouldClearOnNextResetRef = useRef(false);

  const selectedSupplierId =
    values.supplierId && values.supplierId !== ANY_SCOPE_VALUE
      ? values.supplierId
      : null;
  const selectedServiceTypeId =
    values.serviceTypeId && values.serviceTypeId !== ANY_SCOPE_VALUE
      ? values.serviceTypeId
      : null;
  const selectedServiceId =
    values.serviceId && values.serviceId !== ANY_SCOPE_VALUE
      ? values.serviceId
      : null;
  const supplierServicesResult = useSupplierServices(selectedSupplierId);
  const agencyGroups = Array.isArray(agencyGroupsResult.data)
    ? agencyGroupsResult.data
    : [];
  const serviceTypes = Array.isArray(serviceTypesResult.data)
    ? serviceTypesResult.data
    : [];
  const suppliers = Array.isArray(suppliersResult.data)
    ? suppliersResult.data
    : [];
  const supplierServices = Array.isArray(supplierServicesResult.data)
    ? supplierServicesResult.data
    : [];

  const todayIsoDate = useMemo(() => toLocalIsoDateString(), []);
  const formLocked = isMarginRuleFormLocked(mode, rule, todayIsoDate);
  const isActiveEdit =
    mode === "edit" && rule != null && isMarginRuleActive(rule, todayIsoDate);
  const isPending = isCreatingMarginRule || isUpdatingMarginRule;

  const agencyGroupOptions = useMemo(
    () =>
      agencyGroups
        .filter((agencyGroup) => agencyGroup.isActive)
        .map((agencyGroup) => toOption(agencyGroup.id, agencyGroup.name))
        .sort(byLabelAsc),
    [agencyGroups]
  );
  const serviceTypeOptions = useMemo(
    () =>
      [
        { value: ANY_SCOPE_VALUE, label: t("labels.any").toUpperCase() },
        ...serviceTypes.map((serviceType) =>
          toOption(serviceType.id, serviceType.displayName || serviceType.name)
        ),
      ].sort((left, right) =>
        left.value === ANY_SCOPE_VALUE
          ? -1
          : right.value === ANY_SCOPE_VALUE
            ? 1
            : byLabelAsc(left, right)
      ),
    [serviceTypes, t]
  );
  const supplierOptions = useMemo(
    () => [
      { value: ANY_SCOPE_VALUE, label: t("labels.any").toUpperCase() },
      ...suppliers
        .filter((supplier) => supplier.isActive)
        .map((supplier) => toOption(supplier.id, supplier.name))
        .sort(byLabelAsc),
    ],
    [suppliers, t]
  );
  const filteredSupplierServices = useMemo(
    () =>
      supplierServices.filter(
        (service) =>
          service.isActive &&
          matchesSelectedServiceType(
            service,
            selectedServiceTypeId,
            serviceTypes
          )
      ),
    [selectedServiceTypeId, serviceTypes, supplierServices]
  );
  const selectedSupplierService = useMemo(
    () =>
      filteredSupplierServices.find(
        (service) => service.id === selectedServiceId
      ) ??
      supplierServices.find((service) => service.id === selectedServiceId) ??
      null,
    [filteredSupplierServices, selectedServiceId, supplierServices]
  );
  const serviceOptionsForSelect = useMemo(
    () => [
      { value: ANY_SCOPE_VALUE, label: t("labels.any").toUpperCase() },
      ...(!selectedSupplierId
        ? []
        : filteredSupplierServices
            .map((service) =>
              toOption(service.id, getSupplierServiceLabel(service))
            )
            .sort(byLabelAsc)),
    ],
    [filteredSupplierServices, selectedSupplierId, t]
  );
  const optionOptionsForSelect = useMemo(
    () => [
      { value: ANY_SCOPE_VALUE, label: t("labels.any").toUpperCase() },
      ...(!selectedServiceId
        ? []
        : (selectedSupplierService?.options ?? [])
            .filter((option) => option.isActive)
            .map((option) => toOption(option.id, getServiceOptionLabel(option)))
            .sort(byLabelAsc)),
    ],
    [selectedServiceId, selectedSupplierService?.options, t]
  );

  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      setAlert(null);
      resetCreateMarginRule();
      resetUpdateMarginRule();
      return;
    }

    setValues(
      shouldClearOnNextResetRef.current
        ? CLEARED_MARGIN_RULE_FORM_VALUES
        : getInitialMarginRuleFormValues(mode, rule)
    );
    setFieldErrors({});
    setAlert(null);
    shouldClearOnNextResetRef.current = false;
  }, [mode, open, resetCreateMarginRule, resetUpdateMarginRule, rule]);

  if ((mode === "edit" || mode === "duplicate") && !rule) {
    return null;
  }

  const clearFieldState = (fieldName: MarginRuleFieldName) => {
    setFieldErrors((previous) => ({
      ...previous,
      [fieldName]: undefined,
    }));
    setAlert(null);
  };

  const handleFieldChange = (
    fieldName: MarginRuleFieldName,
    nextValue: string
  ) => {
    clearFieldState(fieldName);

    setValues((previous) => {
      const nextValues: MarginRuleFormValues = {
        ...previous,
        [fieldName]: nextValue,
      };

      if (
        fieldName === "serviceTypeId" &&
        previous.serviceTypeId !== nextValue
      ) {
        nextValues.serviceId = ANY_SCOPE_VALUE;
        nextValues.optionId = ANY_SCOPE_VALUE;
      }

      if (fieldName === "supplierId" && previous.supplierId !== nextValue) {
        nextValues.serviceId = ANY_SCOPE_VALUE;
        nextValues.optionId = ANY_SCOPE_VALUE;
      }

      if (fieldName === "serviceId" && previous.serviceId !== nextValue) {
        nextValues.optionId = ANY_SCOPE_VALUE;
      }

      return nextValues;
    });
  };

  const derivedFieldErrors = getMarginRuleFieldErrors(
    values,
    mode,
    t,
    rule,
    todayIsoDate
  );
  const canSubmit =
    Object.values(derivedFieldErrors).every((value) => !value) && !isPending;

  const title =
    mode === "create"
      ? t("modals.createMarginRule")
      : mode === "edit"
        ? t("modals.editMarginRule")
        : t("modals.duplicateMarginRule");

  const showSaveAndCreate = true;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFieldErrors({});
      setAlert(null);
    }

    onOpenChange(nextOpen);
  };

  const applyMutationError = (error: unknown) => {
    if (isMarginRuleDuplicateError(error)) {
      setAlert({
        title: t("errors.marginRuleDuplicateTitle"),
        description: t("errors.marginRuleDuplicateDescription"),
        variant: "duplicate",
      });
      return;
    }

    const validation = getValidationErrors(error);

    if (validation) {
      const nextFieldErrors: MarginRuleFieldErrors = {
        agencyGroupId: getFieldError(validation.errors, "agencyGroupId"),
        serviceTypeId: getFieldError(validation.errors, "serviceTypeId"),
        supplierId: getFieldError(validation.errors, "supplierId"),
        serviceId: getFieldError(validation.errors, "serviceId"),
        optionId: getFieldError(validation.errors, "optionId"),
        validFrom: getFieldError(validation.errors, "validFrom"),
        validTo: getFieldError(validation.errors, "validTo"),
        marginPercent: getFieldError(validation.errors, "marginPercent"),
      };
      const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean);

      setFieldErrors(nextFieldErrors);
      setAlert(
        hasFieldErrors
          ? null
          : {
              title: getErrorMessage(
                error,
                mode === "edit"
                  ? t("errors.failedToUpdateMarginRule")
                  : t("errors.failedToCreateMarginRule")
              ),
              variant: "error",
            }
      );
      return;
    }

    setAlert({
      title: getErrorMessage(
        error,
        mode === "edit"
          ? t("errors.failedToUpdateMarginRule")
          : t("errors.failedToCreateMarginRule")
      ),
      variant: "error",
    });
  };

  const resetAfterSaveAndCreate = () => {
    setValues(CLEARED_MARGIN_RULE_FORM_VALUES);
    setFieldErrors({});
    setAlert(null);
    shouldClearOnNextResetRef.current = true;
  };

  const handleSaveAndCreateSuccess = () => {
    resetAfterSaveAndCreate();
    onSaveAndCreateSuccess?.();
  };

  const submit = (intent: MarginRuleSubmitIntent) => {
    const nextFieldErrors = getMarginRuleFieldErrors(
      values,
      mode,
      t,
      rule,
      todayIsoDate
    );

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const agencyGroupName =
      agencyGroupOptions.find((option) => option.value === values.agencyGroupId)
        ?.label ??
      rule?.agencyGroupName ??
      "";
    const serviceTypeName =
      serviceTypeOptions.find((option) => option.value === values.serviceTypeId)
        ?.label ?? null;
    const supplierName =
      supplierOptions.find((option) => option.value === values.supplierId)
        ?.label ?? null;
    const serviceName =
      serviceOptionsForSelect.find(
        (option) => option.value === values.serviceId
      )?.label ?? null;
    const optionName =
      optionOptionsForSelect.find((option) => option.value === values.optionId)
        ?.label ?? null;

    const cacheItem = buildMarginRuleCacheItem(values, {
      agencyGroupName,
      serviceTypeName:
        values.serviceTypeId && values.serviceTypeId !== ANY_SCOPE_VALUE
          ? serviceTypeName
          : null,
      supplierName:
        values.supplierId && values.supplierId !== ANY_SCOPE_VALUE
          ? supplierName
          : null,
      serviceName:
        values.serviceId && values.serviceId !== ANY_SCOPE_VALUE
          ? serviceName
          : null,
      optionName:
        values.optionId && values.optionId !== ANY_SCOPE_VALUE
          ? optionName
          : null,
    });

    if (mode === "edit" && rule) {
      updateMarginRule(
        {
          marginRuleId: rule.id,
          payload: toUpdateMarginRulePayload(values, rule.version),
          previousRule: rule,
          cacheItem,
        },
        {
          onSuccess: () => {
            if (intent === "saveAndCreate") {
              handleSaveAndCreateSuccess();
              return;
            }

            onOpenChange(false);
          },
          onError: applyMutationError,
        }
      );
      return;
    }

    createMarginRule(
      {
        payload: toCreateMarginRulePayload(values),
        cacheItem,
      },
      {
        onSuccess: () => {
          if (intent === "saveAndCreate") {
            handleSaveAndCreateSuccess();
            return;
          }

          onOpenChange(false);
        },
        onError: applyMutationError,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[474px] rounded-[12px] px-5 py-6"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold leading-7 text-text-primary">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {alert ? (
            <div
              className={cn(
                "flex gap-3 rounded-md px-4 py-3",
                alert.variant === "duplicate"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-destructive/10 text-destructive"
              )}
              role="alert"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-bold leading-5">{alert.title}</p>
                {alert.description ? (
                  <p className="text-sm font-medium leading-6 opacity-80">
                    {alert.description}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              submit("save");
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup
                label={t("labels.agencyGroup")}
                required
                error={fieldErrors.agencyGroupId}
              >
                <DropdownSelect
                  value={values.agencyGroupId || undefined}
                  options={agencyGroupOptions}
                  onValueChange={(value) =>
                    handleFieldChange("agencyGroupId", value)
                  }
                  isSearchable
                  disabled={formLocked}
                  className={fieldErrorClassName(
                    Boolean(fieldErrors.agencyGroupId)
                  )}
                />
              </FieldGroup>

              <FieldGroup
                label={t("labels.serviceType")}
                required
                error={fieldErrors.serviceTypeId}
              >
                <DropdownSelect
                  value={values.serviceTypeId || undefined}
                  options={serviceTypeOptions}
                  onValueChange={(value) =>
                    handleFieldChange("serviceTypeId", value)
                  }
                  isSearchable
                  disabled={formLocked}
                  className={fieldErrorClassName(
                    Boolean(fieldErrors.serviceTypeId)
                  )}
                />
              </FieldGroup>
            </div>

            <FieldGroup
              label={t("labels.supplier")}
              error={fieldErrors.supplierId}
            >
              <DropdownSelect
                value={values.supplierId || undefined}
                options={supplierOptions}
                onValueChange={(value) =>
                  handleFieldChange("supplierId", value)
                }
                isSearchable
                disabled={formLocked}
                className={fieldErrorClassName(Boolean(fieldErrors.supplierId))}
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup
                label={t("labels.service")}
                error={fieldErrors.serviceId}
                disabled={formLocked}
              >
                <DropdownSelect
                  value={values.serviceId || undefined}
                  options={serviceOptionsForSelect}
                  onValueChange={(value) =>
                    handleFieldChange("serviceId", value)
                  }
                  isSearchable
                  disabled={formLocked}
                  className={fieldErrorClassName(
                    Boolean(fieldErrors.serviceId)
                  )}
                />
              </FieldGroup>

              <FieldGroup
                label={t("labels.option")}
                error={fieldErrors.optionId}
                disabled={formLocked}
              >
                <DropdownSelect
                  value={values.optionId || undefined}
                  options={optionOptionsForSelect}
                  onValueChange={(value) =>
                    handleFieldChange("optionId", value)
                  }
                  isSearchable
                  disabled={formLocked}
                  className={fieldErrorClassName(Boolean(fieldErrors.optionId))}
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup
                label={t("labels.validFrom")}
                required
                error={fieldErrors.validFrom}
              >
                <DatePickerGridInput
                  value={values.validFrom || undefined}
                  onChange={(value) => handleFieldChange("validFrom", value)}
                  disabled={formLocked}
                  hasError={Boolean(fieldErrors.validFrom)}
                />
              </FieldGroup>

              <FieldGroup
                label={t("labels.validTo")}
                error={fieldErrors.validTo}
              >
                <DatePickerGridInput
                  value={values.validTo || undefined}
                  onChange={(value) => handleFieldChange("validTo", value)}
                  disabled={formLocked && !isActiveEdit}
                  hasError={Boolean(fieldErrors.validTo)}
                  isDateDisabled={
                    isActiveEdit
                      ? (date) =>
                          toLocalIsoDateString(date) <
                          getTomorrowIsoDate(todayIsoDate)
                      : undefined
                  }
                />
              </FieldGroup>
            </div>

            <FieldGroup
              label={t("labels.marginPercent")}
              required
              error={fieldErrors.marginPercent}
            >
              <Input
                value={values.marginPercent}
                placeholder={t("placeholders.typeMargin")}
                onChange={(event) =>
                  handleFieldChange("marginPercent", event.target.value)
                }
                disabled={formLocked}
                inputMode="decimal"
                aria-invalid={Boolean(fieldErrors.marginPercent)}
                className={cn(
                  fieldErrorClassName(Boolean(fieldErrors.marginPercent))
                )}
              />
            </FieldGroup>
          </form>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t("common:buttons.cancel")}
            </Button>

            <div className="flex items-center gap-3">
              {showSaveAndCreate ? (
                <Button
                  type="button"
                  variant="tertiary"
                  disabled={!canSubmit}
                  onClick={() => submit("saveAndCreate")}
                >
                  {t("buttons.saveAndCreate")}
                </Button>
              ) : null}

              <Button
                type="button"
                variant="primary"
                disabled={!canSubmit}
                isLoading={isPending}
                onClick={() => submit("save")}
              >
                {t("common:buttons.save")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
