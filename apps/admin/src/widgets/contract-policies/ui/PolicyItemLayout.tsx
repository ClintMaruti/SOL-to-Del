import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Separator,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import { ChevronDown, Info, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { clearFormScopedOnSubmitFieldErrorsByPrefix } from "@/shared/lib/form";
import { DatePickerGridInput, FormField } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { VALIDATION_MESSAGES } from "@/shared/ui/form";

import { ErrorAlert } from "./ErrorAlert";
import { PenaltyRuleRow } from "./PenaltyRuleRow";

const NEW_RULE_DEFAULTS = {
  starts: "Before" as const,
  referenceEvent: "TravelDate" as const,
  startDay: "" as const,
  startTime: "00:00",
  endDay: "" as const,
  endTime: "23:59",
  penaltyValue: "" as const,
  penaltyType: "Percent" as const,
};

const NEW_TRAVEL_DATE_DEFAULTS = {
  from: "",
  to: "",
};

function splitAlertMessages(message?: string) {
  return (message ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface PolicyItemLayoutProps {
  form: AnyFormApi;
  isPending: boolean;
  isDirty: boolean;
  schemaError?: string;
  networkErrors?: string[];
  onClearErrors?: () => void;
  onCancel?: () => void;
  initialConditions?: Record<string, unknown>[];
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headerContent: ReactNode;
  contentTitle?: ReactNode;
}

export function PolicyItemLayout({
  form,
  isPending,
  isDirty,
  schemaError,
  networkErrors,
  onClearErrors,
  onCancel,
  initialConditions = [],
  defaultOpen = false,
  open,
  onOpenChange,
  headerContent,
  contentTitle,
}: PolicyItemLayoutProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const schemaErrorMessages = splitAlertMessages(schemaError);
  const networkErrorMessages =
    networkErrors?.flatMap((message) => splitAlertMessages(message)) ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleAddRule = () => {
    form.pushFieldValue("conditions", { ...NEW_RULE_DEFAULTS });
  };

  const handleRemoveRule = (idx: number) => {
    form.removeFieldValue("conditions", idx);
  };

  const handleAddTravelDate = () => {
    clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");
    onClearErrors?.();
    form.pushFieldValue("travelDates", {
      ...NEW_TRAVEL_DATE_DEFAULTS,
    });
  };

  const handleRemoveTravelDate = (idx: number) => {
    clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");
    onClearErrors?.();
    form.removeFieldValue("travelDates", idx);
  };

  const handleTravelDateChange = (
    onChange: (value: string) => void,
    value: string
  ) => {
    onChange(value);
    clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");
    onClearErrors?.();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <div className="overflow-hidden rounded-[6px] border border-border-tertiary">
        <div className="bg-white flex items-center gap-3 px-4 py-3">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline-secondary"
              size="icon-sm"
              className="shrink-0 size-9"
            >
              <ChevronDown
                className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
            </Button>
          </CollapsibleTrigger>
          {headerContent}
        </div>

        <CollapsibleContent>
          <div className="flex flex-col border-t border-border-tertiary bg-background-tetriary">
            <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
              <form.Field name="refundable">
                {(refundableField: AnyFieldApi) => (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,560px)_minmax(0,560px)] xl:gap-10">
                      <div className="flex min-w-0 flex-col gap-3">
                        {contentTitle ? (
                          <p className="text-sm font-bold leading-5 text-text-primary">
                            {contentTitle}
                          </p>
                        ) : null}

                        <FormField
                          form={form}
                          name="policyName"
                          label={t("admin:policies.policyName")}
                          required
                          validators={{
                            onSubmit: ({ value }: { value: string }) =>
                              !value.trim()
                                ? VALIDATION_MESSAGES.required(
                                    t("admin:policies.policyName")
                                  )
                                : undefined,
                          }}
                        >
                          {(field) => (
                            <Input
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              placeholder={t("admin:policies.typePolicyName")}
                              aria-invalid={!field.state.meta.isValid}
                            />
                          )}
                        </FormField>

                        <FormField
                          form={form}
                          name="description"
                          label={t("admin:policies.description")}
                          required
                          validators={{
                            onSubmit: ({ value }: { value: string }) =>
                              !value.trim()
                                ? VALIDATION_MESSAGES.required(
                                    t("admin:policies.description")
                                  )
                                : undefined,
                          }}
                        >
                          {(field) => (
                            <Textarea
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              placeholder={t("admin:policies.typeDescription")}
                              aria-invalid={!field.state.meta.isValid}
                              className="min-h-[94px] bg-white"
                            />
                          )}
                        </FormField>

                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={refundableField.state.value}
                            onCheckedChange={(checked) => {
                              refundableField.handleChange(checked);
                              onClearErrors?.();
                              if (checked) {
                                const conditions =
                                  form.getFieldValue("conditions");
                                if (!conditions || conditions.length === 0) {
                                  form.pushFieldValue("conditions", {
                                    ...NEW_RULE_DEFAULTS,
                                  });
                                }
                              } else {
                                const conditions =
                                  form.getFieldValue("conditions");
                                if (conditions && conditions.length > 0) {
                                  for (
                                    let i = conditions.length - 1;
                                    i >= 0;
                                    i--
                                  ) {
                                    form.removeFieldValue("conditions", i);
                                  }
                                }
                                for (const condition of initialConditions) {
                                  form.pushFieldValue("conditions", {
                                    ...condition,
                                  });
                                }
                              }
                            }}
                          />
                          <span className="text-sm font-semibold text-text-primary">
                            {t("admin:policies.refundable")}
                          </span>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="size-4 cursor-help text-text-info-bold" />
                              </TooltipTrigger>
                              <TooltipContent
                                className="max-w-xs py-4"
                                side="right"
                              >
                                <p className="font-semibold text-white">
                                  {t("admin:policies.refundableTooltipTitle")}
                                </p>
                                <p className="mt-0.5 font-normal text-white/90">
                                  {t("admin:policies.refundableTooltip")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col gap-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold leading-5 text-text-primary">
                            {t("admin:labels.travelDates")}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleAddTravelDate}
                            className="h-8 gap-1 px-3 text-brand-red hover:text-brand-red"
                          >
                            <Plus className="size-4" />
                            {t("admin:buttons.add")}
                          </Button>
                        </div>

                        <form.Field name="travelDates" mode="array">
                          {(field: AnyFieldApi) => {
                            const ranges = Array.isArray(field.state.value)
                              ? field.state.value
                              : [];

                            return (
                              <div className="flex flex-col gap-2">
                                {ranges.map((_: unknown, idx: number) => {
                                  const fromFieldName = `travelDates[${idx}].from`;
                                  const toFieldName = `travelDates[${idx}].to`;

                                  return (
                                    <div
                                      key={idx}
                                      className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                                    >
                                      <FormField
                                        form={form}
                                        name={fromFieldName}
                                        label={t("admin:labels.from")}
                                        required
                                        validators={{
                                          onSubmit: ({
                                            value,
                                          }: {
                                            value: string;
                                          }) =>
                                            !value
                                              ? VALIDATION_MESSAGES.required(
                                                  t("admin:labels.from")
                                                )
                                              : undefined,
                                        }}
                                        hideError
                                      >
                                        {(rangeField) => {
                                          const hasError =
                                            rangeField.state.meta.errors
                                              .length > 0;

                                          return (
                                            <DatePickerGridInput
                                              id={rangeField.name}
                                              value={rangeField.state.value}
                                              onChange={(value) =>
                                                handleTravelDateChange(
                                                  rangeField.handleChange,
                                                  value
                                                )
                                              }
                                              placeholder={t(
                                                "common:placeholders.selectDate"
                                              )}
                                              hasError={hasError}
                                              className={cn(
                                                hasError
                                                  ? "border-[color:var(--input-border-error)] bg-[color:var(--input-bg-error)]"
                                                  : "bg-white"
                                              )}
                                            />
                                          );
                                        }}
                                      </FormField>

                                      <FormField
                                        form={form}
                                        name={toFieldName}
                                        label={t("admin:labels.to")}
                                        validators={{
                                          onSubmit: ({
                                            value,
                                          }: {
                                            value: string;
                                          }) => {
                                            const from = form.getFieldValue(
                                              fromFieldName
                                            ) as string;
                                            if (value && from && value < from) {
                                              return t(
                                                "admin:validation.travelDateFromBeforeTo"
                                              );
                                            }
                                            return undefined;
                                          },
                                        }}
                                        hideError
                                      >
                                        {(rangeField) => {
                                          const hasError =
                                            rangeField.state.meta.errors
                                              .length > 0;

                                          return (
                                            <DatePickerGridInput
                                              id={rangeField.name}
                                              value={rangeField.state.value}
                                              onChange={(value) =>
                                                handleTravelDateChange(
                                                  rangeField.handleChange,
                                                  value
                                                )
                                              }
                                              placeholder={t(
                                                "common:placeholders.selectDate"
                                              )}
                                              hasError={hasError}
                                              className={cn(
                                                hasError
                                                  ? "border-[color:var(--input-border-error)] bg-[color:var(--input-bg-error)]"
                                                  : "bg-white"
                                              )}
                                            />
                                          );
                                        }}
                                      </FormField>

                                      {ranges.length > 1 ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon-sm"
                                          className="self-end"
                                          onClick={() =>
                                            handleRemoveTravelDate(idx)
                                          }
                                          aria-label={t("admin:buttons.remove")}
                                        >
                                          <Trash2 className="size-4 text-brand-red" />
                                        </Button>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }}
                        </form.Field>
                      </div>
                    </div>

                    {refundableField.state.value && (
                      <>
                        <Separator />
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold leading-5 text-text-primary">
                              {t("admin:policies.penaltyRules")}
                              <span className="text-[#f54a00]">*</span>
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleAddRule}
                              className="gap-1"
                            >
                              <Plus className="size-4" />
                              {t("admin:policies.createRule")}
                            </Button>
                          </div>

                          <form.Field name="conditions" mode="array">
                            {(field: AnyFieldApi) =>
                              field.state.value.map(
                                (_: unknown, idx: number) => (
                                  <PenaltyRuleRow
                                    key={idx}
                                    form={form}
                                    index={idx}
                                    onRemove={() => handleRemoveRule(idx)}
                                  />
                                )
                              )
                            }
                          </form.Field>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </form.Field>

              {schemaErrorMessages.length > 0 ? (
                <ErrorAlert messages={schemaErrorMessages} />
              ) : null}

              {networkErrorMessages.length > 0 ? (
                <ErrorAlert messages={networkErrorMessages} />
              ) : null}
            </div>

            <div className="flex justify-end border-t border-border-tertiary bg-background-primary px-6 py-4">
              <div className="flex items-start gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onCancel}
                  disabled={isPending}
                >
                  {t("common:buttons.cancel")}
                </Button>
                <Button
                  type="button"
                  size="md"
                  onClick={() => form.handleSubmit()}
                  isLoading={isPending}
                  disabled={!isDirty || isPending}
                >
                  {t("admin:buttons.savePolicy")}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
