import { Button, Input, Separator, cn } from "@sol/ui";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { EligibilityValidityDate } from "@/entities/service-eligibility";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

import { parseNonNegativeNumber } from "../model/parseNonNegativeNumber";
import { useMinMaxValidators } from "../model/useMinMaxValidators";
import { ValidityDateRow } from "./ValidityDateRow";

const NUM_INPUT_CLS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface MinMaxGroupProps {
  form: AnyFormApi;
  label: string;
  minName: string;
  maxName: string;
  saveAttempted?: boolean;
  disabled?: boolean;
}

function MinMaxGroup({
  form,
  label,
  minName,
  maxName,
  saveAttempted,
  disabled,
}: MinMaxGroupProps) {
  const { t } = useTranslation("admin");
  const { maxValidators, minValidators } = useMinMaxValidators({
    form,
    minName,
    maxName,
  });

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <div className="flex gap-2">
        <FormField
          form={form}
          name={minName}
          label={t("labels.min")}
          className="min-w-0 flex-1"
          validators={minValidators}
          hideError
        >
          {(field) => {
            const val = field.state.value as number | null;
            const hasError =
              field.state.meta.errors.length > 0 ||
              (saveAttempted && val !== null && val < 0);
            return (
              <Input
                id={minName}
                type="number"
                min={0}
                disabled={disabled}
                value={val ?? ""}
                onChange={(e) => {
                  field.handleChange(parseNonNegativeNumber(e.target.value));
                  const maxVal = form.getFieldValue(maxName);
                  form.setFieldValue(maxName, maxVal);
                }}
                onBlur={field.handleBlur}
                placeholder="-"
                className={cn(
                  "h-9",
                  NUM_INPUT_CLS,
                  hasError && "border-destructive"
                )}
              />
            );
          }}
        </FormField>
        <FormField
          form={form}
          name={maxName}
          label={t("labels.max")}
          className="min-w-0 flex-1"
          validators={maxValidators}
          hideError
        >
          {(field) => {
            const val = field.state.value as number | null;
            const hasError =
              field.state.meta.errors.length > 0 ||
              (saveAttempted && val !== null && val < 0);
            return (
              <Input
                id={maxName}
                type="number"
                min={0}
                disabled={disabled}
                value={val ?? ""}
                onChange={(e) => {
                  field.handleChange(parseNonNegativeNumber(e.target.value));
                  const minVal = form.getFieldValue(minName);
                  form.setFieldValue(minName, minVal);
                }}
                onBlur={field.handleBlur}
                placeholder="-"
                className={cn(
                  "h-9",
                  NUM_INPUT_CLS,
                  hasError && "border-destructive"
                )}
              />
            );
          }}
        </FormField>
      </div>
    </div>
  );
}

interface CapacityDurationCardProps {
  form: AnyFormApi;
  validityDates: EligibilityValidityDate[];
  eligibilityId: string;
  serviceId: string;
  saveAttempted?: boolean;
  disabled?: boolean;
  onAddValidityDate: () => void;
  onRemoveValidityDate: (id: string) => void;
  onUpdateValidityDate: (
    id: string,
    updates: Partial<Pick<EligibilityValidityDate, "from" | "to">>
  ) => void;
}

export function CapacityDurationCard({
  form,
  validityDates,
  eligibilityId,
  serviceId,
  saveAttempted,
  disabled,
  onAddValidityDate,
  onRemoveValidityDate,
  onUpdateValidityDate,
}: CapacityDurationCardProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="w-full max-w-[380px] shrink-0 rounded-[6px] border border-border bg-background p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MinMaxGroup
          form={form}
          label={t("sections.totalPax")}
          minName="totalPaxMin"
          maxName="totalPaxMax"
          saveAttempted={saveAttempted}
          disabled={disabled}
        />
        <MinMaxGroup
          form={form}
          label={t("sections.unit")}
          minName="unitsMin"
          maxName="unitsMax"
          saveAttempted={saveAttempted}
          disabled={disabled}
        />
        <MinMaxGroup
          form={form}
          label={t("sections.nights")}
          minName="nightsMin"
          maxName="nightsMax"
          saveAttempted={saveAttempted}
          disabled={disabled}
        />
      </div>

      <div className="mt-4 max-w-[11rem]">
        <FormField
          form={form}
          name="minimumAge"
          label={t("labels.minimumAge")}
          hideError
        >
          {(field) => {
            const val = field.state.value as number | null;
            const hasError = saveAttempted && val !== null && val < 0;
            return (
              <Input
                id="minimumAge"
                type="number"
                min={0}
                value={val ?? ""}
                onChange={(e) =>
                  field.handleChange(parseNonNegativeNumber(e.target.value))
                }
                onBlur={field.handleBlur}
                placeholder="-"
                disabled={disabled}
                className={cn(
                  "h-9",
                  NUM_INPUT_CLS,
                  hasError && "border-destructive"
                )}
              />
            );
          }}
        </FormField>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-foreground">
            {t("sections.validityDates")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddValidityDate}
            className="text-brand-red hover:text-brand-red"
            disabled={disabled}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("buttons.add")}
          </Button>
        </div>

        {validityDates.length > 0 && (
          <div
            className="grid gap-x-2 gap-y-1"
            style={{ gridTemplateColumns: "1fr 1fr 32px" }}
          >
            {validityDates.map((vd, index) => (
              <ValidityDateRow
                key={vd.id}
                dateId={vd.id}
                from={vd.from}
                to={vd.to}
                eligibilityId={eligibilityId}
                serviceId={serviceId}
                saveAttempted={saveAttempted}
                onUpdate={onUpdateValidityDate}
                onRemove={onRemoveValidityDate}
                disabled={disabled}
                showHeaders={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
