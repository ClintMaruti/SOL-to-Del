import {
  Button,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormField } from "@/shared/ui";
import { VALIDATION_MESSAGES, type AnyFormApi } from "@/shared/ui/form";

import { ErrorAlert } from "./ErrorAlert";

interface ToggleButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function ToggleButtonGroup({
  value,
  onChange,
  options,
}: ToggleButtonGroupProps) {
  return (
    <div className="flex overflow-hidden rounded-[6px]">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-9 px-2 text-sm font-medium transition-colors border",
            value === option.value
              ? "bg-brand-red text-white border-brand-red"
              : "bg-background text-foreground hover:bg-muted border-gray-200",
            index === 1 && "rounded-r-[6px]",
            index === 0 && "rounded-l-[6px]"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface PenaltyRuleRowProps {
  form: AnyFormApi;
  index: number;
  onRemove: () => void;
}

function useFieldErrors(form: AnyFormApi, fieldPaths: string[]): string[] {
  return useStore(form.store, (state: unknown) => {
    const { fieldMeta } = state as {
      fieldMeta: Record<string, { errors: unknown[] } | undefined>;
    };
    return fieldPaths.flatMap((path: string) => {
      const meta = fieldMeta[path];
      if (!meta) return [];
      return meta.errors.filter(
        (e: unknown): e is string => typeof e === "string"
      );
    });
  });
}

export function PenaltyRuleRow({ form, index, onRemove }: PenaltyRuleRowProps) {
  const { t } = useTranslation("admin");
  const fp = (field: string) => `conditions[${index}].${field}`;

  const errorFieldPaths = [
    fp("startDay"),
    fp("startTime"),
    fp("endDay"),
    fp("endTime"),
    fp("penaltyValue"),
  ];
  const errors = useFieldErrors(form, errorFieldPaths);

  return (
    <div className="bg-white border border-border rounded-[6px] p-4 flex flex-col gap-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-neutral-900">
          {t("policies.ruleNumber", { number: index + 1 })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="gap-1"
        >
          <Trash2 className="size-4" />
          {t("policies.removeRule")}
        </Button>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <FormField
          form={form}
          name={fp("starts")}
          label={t("policies.starts")}
          hideError
          className="w-auto shrink-0"
        >
          {(field) => (
            <ToggleButtonGroup
              value={field.state.value}
              onChange={(v) => field.handleChange(v)}
              options={[
                { value: "Before", label: t("policies.before") },
                { value: "After", label: t("policies.after") },
              ]}
            />
          )}
        </FormField>

        <FormField
          form={form}
          name={fp("referenceEvent")}
          label={t("policies.on")}
          hideError
          className="w-auto shrink-0"
        >
          {(field) => (
            <ToggleButtonGroup
              value={field.state.value}
              onChange={(v) => field.handleChange(v)}
              options={[
                { value: "TravelDate", label: t("policies.travelDate") },
                { value: "BookingDate", label: t("policies.bookingDate") },
              ]}
            />
          )}
        </FormField>

        <div className="flex min-w-[min(100%,16rem)] flex-1 gap-2">
          <FormField
            form={form}
            name={fp("startDay")}
            label={t("policies.startDay")}
            required
            hideError
            className="min-w-0 flex-1"
            validators={{
              onSubmit: ({ value }: { value: number | "" }) =>
                value === ""
                  ? VALIDATION_MESSAGES.required(t("policies.startDay"))
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                type="number"
                min={0}
                className="h-9"
                placeholder={t("placeholders.exampleNumber")}
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name={fp("startTime")}
            label={t("policies.startTime")}
            required
            hideError
            className="min-w-0 flex-1"
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value
                  ? VALIDATION_MESSAGES.required(t("policies.startTime"))
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                type="time"
                className={cn("input-time-no-picker", "h-9")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>
        </div>

        <div className="flex min-w-[min(100%,16rem)] flex-1 gap-2">
          <FormField
            form={form}
            name={fp("endDay")}
            label={t("policies.endDay")}
            required
            hideError
            className="min-w-0 flex-1"
            validators={{
              onSubmit: ({ value }: { value: number | "" }) =>
                value === ""
                  ? VALIDATION_MESSAGES.required(t("policies.endDay"))
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                type="number"
                min={0}
                className="h-9"
                placeholder={t("placeholders.exampleNumber")}
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name={fp("endTime")}
            label={t("policies.endTime")}
            required
            hideError
            className="min-w-0 flex-1"
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value
                  ? VALIDATION_MESSAGES.required(t("policies.endTime"))
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                type="time"
                className={cn("input-time-no-picker", "h-9")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>
        </div>

        <div className="w-full max-w-[208px] shrink-0 sm:w-[208px]">
          <Label className="pt-1 pb-2 block text-sm font-semibold text-neutral-900">
            {t("policies.penalty")}
            <span className="text-destructive">*</span>
          </Label>
          <div className="flex h-9 overflow-hidden rounded-[6px] border border-[color:var(--input-border-default)] bg-[color:var(--input-bg-filled)] focus-within:border-[color:var(--input-border-focus)]">
            <FormField
              form={form}
              name={fp("penaltyValue")}
              hideError
              className="w-[98px] shrink-0"
              validators={{
                onSubmit: ({ value }: { value: number | "" }) =>
                  value === ""
                    ? VALIDATION_MESSAGES.required(t("policies.penalty"))
                    : undefined,
              }}
            >
              {(field) => (
                <Input
                  type="number"
                  min={0}
                  className="h-full w-[98px] rounded-none border-0 bg-transparent focus-visible:rounded-none focus-visible:border-0 data-[filled=true]:bg-transparent"
                  placeholder={t("placeholders.exampleNumber")}
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  onBlur={field.handleBlur}
                  aria-invalid={!field.state.meta.isValid}
                />
              )}
            </FormField>
            <div
              aria-hidden
              className="w-px self-stretch bg-[color:var(--input-border-default)]"
            />
            <form.Field name={fp("penaltyType")}>
              {(typeField: {
                state: { value: string };
                handleChange: (v: string) => void;
              }) => (
                <Select
                  value={typeField.state.value}
                  onValueChange={(v) => typeField.handleChange(v)}
                >
                  <SelectTrigger className="h-full w-[109px] rounded-none border-0 bg-transparent focus-visible:rounded-none focus-visible:border-0 data-[filled=true]:bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percent">
                      {t("policies.percentage")}
                    </SelectItem>
                    <SelectItem value="Value">{t("policies.value")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </form.Field>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="flex flex-col gap-2">
          {errors.map((error, i) => (
            <ErrorAlert key={i} message={error} />
          ))}
        </div>
      )}
    </div>
  );
}
