import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Input,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useCreateSupplierPaxTypeSchedule,
  type PaxType,
} from "@/entities/supplier-pax-type-schedule";
import { DatePickerGridInput, FormField, FormMessage } from "@/shared/ui";
import { VALIDATION_MESSAGES } from "@/shared/ui/form";

import { mapCreateSupplierPaxTypeSchedulePayload } from "../model/payloadMappers";
import {
  createDefaultAddPaxConfigurationValues,
  type SupplierPaxTypeFormRow,
} from "../model/types";
import { useAddPaxConfigurationForm } from "../model/useAddPaxConfigurationForm";
import type {
  SupplierPaxTypesValidationResult,
  SupplierPaxValidationMessages,
} from "../model/validation";

interface AddPaxConfigurationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

function getPaxLabelKey(paxType: PaxType) {
  return `paxTypes.${paxType.toLowerCase()}`;
}

function getPaxAgeLabelKey(paxType: PaxType) {
  return `supplierPaxConfigurations.${paxType.toLowerCase()}AgeLabel`;
}

function DashedSeparator() {
  return <div className="h-px w-full border-t border-dashed border-gray-200" />;
}

export function AddPaxConfigurationSheet({
  open,
  onOpenChange,
  supplierId,
}: AddPaxConfigurationSheetProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: createSchedule,
    isPending,
    error: apiError,
    reset: resetMutation,
  } = useCreateSupplierPaxTypeSchedule();
  const [validationResult, setValidationResult] = useState<
    SupplierPaxTypesValidationResult | undefined
  >();

  const validationMessages = useMemo<SupplierPaxValidationMessages>(
    () => ({
      validFromRequired: VALIDATION_MESSAGES.required(
        t("admin:labels.validFrom")
      ),
      activeAgeRangeRequired: t(
        "admin:validation.supplierPaxActiveAgeRangeRequired"
      ),
      ageFromLessThanAgeTo: t("admin:validation.supplierPaxAgeFromLessThanTo"),
      rangesMustNotOverlap: t(
        "admin:validation.supplierPaxRangesMustNotOverlap"
      ),
      adultCannotBeDeactivated: t(
        "admin:validation.supplierPaxAdultCannotBeDeactivated"
      ),
      adultMustCoverHighestAgeBoundary: t(
        "admin:validation.supplierPaxAdultMustCoverHighestAgeBoundary"
      ),
      endDateMustBeOnOrAfterStart: t(
        "admin:validation.supplierPaxEndDateMustBeOnOrAfterStart"
      ),
    }),
    [t]
  );

  const { form } = useAddPaxConfigurationForm({
    messages: validationMessages,
    onValidationError: setValidationResult,
    onSubmit: (values) => {
      createSchedule(
        mapCreateSupplierPaxTypeSchedulePayload(supplierId, values),
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    },
  });

  const paxTypes = useStore(
    form.store,
    (state) => state.values.paxTypes
  ) as SupplierPaxTypeFormRow[];

  useEffect(() => {
    if (!open) {
      form.reset(createDefaultAddPaxConfigurationValues());
      setValidationResult(undefined);
      resetMutation();
    }
  }, [form, open, resetMutation]);

  const updatePaxType = (
    paxType: PaxType,
    patch: Partial<SupplierPaxTypeFormRow>
  ) => {
    form.setFieldValue(
      "paxTypes",
      paxTypes.map((row) =>
        row.paxType === paxType
          ? {
              ...row,
              ...patch,
              isActive:
                paxType === "Adult" ? true : (patch.isActive ?? row.isActive),
            }
          : row
      )
    );
    setValidationResult(undefined);
  };

  const handleCancel = () => {
    form.reset(createDefaultAddPaxConfigurationValues());
    setValidationResult(undefined);
    resetMutation();
    onOpenChange(false);
  };

  const formError =
    validationResult?.form[0] ??
    (apiError
      ? getErrorMessage(
          apiError,
          t("admin:supplierPaxConfigurations.failedToCreate")
        )
      : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="top-3 right-3 bottom-3 h-auto w-[calc(100vw-24px)] max-w-[372px] gap-0 overflow-hidden rounded-[12px] border border-gray-200 bg-white p-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)] sm:w-[372px] sm:max-w-[372px]"
      >
        <SheetHeader className="shrink-0 flex-row items-center justify-between gap-3 bg-[#f9fafb] px-6 pt-6 pb-4">
          <SheetTitle className="text-lg font-bold leading-7 tracking-[-0.4px] text-neutral-900">
            {t("admin:supplierPaxConfigurations.drawerTitle")}
          </SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              aria-label={t("common:buttons.close")}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] text-neutral-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </button>
          </SheetClose>
        </SheetHeader>
        <DashedSeparator />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setValidationResult(undefined);
            form.handleSubmit();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-6">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-3">
                <FormField
                  form={form}
                  name="validFrom"
                  label={t("admin:labels.validFrom")}
                  required
                  error={validationResult?.validFrom}
                  validators={{
                    onSubmit: ({ value }: { value: string }) =>
                      !value
                        ? VALIDATION_MESSAGES.required(
                            t("admin:labels.validFrom")
                          )
                        : undefined,
                  }}
                >
                  {(field) => (
                    <DatePickerGridInput
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                        setValidationResult(undefined);
                      }}
                      placeholder={t("admin:placeholders.selectStartDate")}
                      className={cn(
                        (field.state.meta.errors.length > 0 ||
                          Boolean(validationResult?.validFrom)) &&
                          "border-destructive",
                        "bg-[#f9fafb]"
                      )}
                    />
                  )}
                </FormField>

                <FormField
                  form={form}
                  name="validTo"
                  label={t("admin:labels.validTo")}
                  error={validationResult?.validTo}
                >
                  {(field) => (
                    <DatePickerGridInput
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                        setValidationResult(undefined);
                      }}
                      placeholder={t("common:placeholders.selectDate")}
                      className={cn(
                        Boolean(validationResult?.validTo) &&
                          "border-destructive",
                        "bg-white"
                      )}
                    />
                  )}
                </FormField>
              </div>

              <DashedSeparator />

              <div className="flex flex-col gap-6">
                {paxTypes.map((row, index) => {
                  const errors = validationResult?.paxTypes[row.paxType] ?? {};
                  const isAdult = row.paxType === "Adult";
                  const label = t(`admin:${getPaxLabelKey(row.paxType)}`);
                  const inputBackground = row.isActive
                    ? "bg-[#f9fafb]"
                    : "bg-white";

                  return (
                    <section key={row.paxType} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-neutral-900 leading-6">
                          {t(`admin:${getPaxAgeLabelKey(row.paxType)}`)}
                        </h3>
                        {isAdult ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Switch checked disabled aria-label={label} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              className="max-w-[260px]"
                            >
                              {t(
                                "admin:supplierPaxConfigurations.adultTooltip"
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Switch
                            checked={row.isActive}
                            onCheckedChange={(checked) =>
                              updatePaxType(row.paxType, {
                                isActive: checked,
                              })
                            }
                            aria-label={label}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3">
                        <label
                          htmlFor={`pax-${row.paxType}-from`}
                          className="text-sm font-semibold text-neutral-900 leading-6"
                        >
                          {t("admin:labels.from")}
                        </label>
                        <Input
                          id={`pax-${row.paxType}-from`}
                          type="number"
                          min={0}
                          value={row.ageFrom}
                          placeholder={t("admin:placeholders.typeHere")}
                          onChange={(event) =>
                            updatePaxType(row.paxType, {
                              ageFrom: event.target.value,
                            })
                          }
                          aria-invalid={Boolean(errors.ageFrom)}
                          className={cn(
                            "h-9 min-w-0 px-3 text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                            inputBackground,
                            Boolean(errors.ageFrom) && "border-destructive"
                          )}
                        />
                        <label
                          htmlFor={`pax-${row.paxType}-to`}
                          className="text-sm font-semibold text-neutral-900 leading-6"
                        >
                          {t("admin:labels.to")}
                        </label>
                        <Input
                          id={`pax-${row.paxType}-to`}
                          type="number"
                          min={0}
                          value={row.ageTo}
                          placeholder={t("admin:placeholders.typeHere")}
                          onChange={(event) =>
                            updatePaxType(row.paxType, {
                              ageTo: event.target.value,
                            })
                          }
                          aria-invalid={Boolean(errors.ageTo)}
                          className={cn(
                            "h-9 min-w-0 px-3 text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                            inputBackground,
                            Boolean(errors.ageTo) && "border-destructive"
                          )}
                        />
                      </div>

                      {index < paxTypes.length - 1 ? <DashedSeparator /> : null}
                    </section>
                  );
                })}
              </div>

              {formError ? (
                <div className="rounded-[6px] bg-destructive/10 p-3">
                  <FormMessage message={formError} />
                </div>
              ) : null}
            </div>
          </div>

          <DashedSeparator />

          <SheetFooter className="shrink-0 flex-row justify-end gap-4 bg-[#f9fafb] px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
              className="h-9 bg-gray-200 px-4 hover:bg-gray-100"
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending} className="h-9 px-4">
              {t("common:buttons.save")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
