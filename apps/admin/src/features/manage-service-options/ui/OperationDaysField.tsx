import { Checkbox, Label, Toggle } from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";

import { OPERATING_DAY_CODES } from "../model/operating-days";

interface OperationDaysFieldProps {
  form: AnyFormApi;
  /** When true, at least one operating day must be selected on submit (flight). */
  requireAtLeastOne: boolean;
  className?: string;
  toggleClassName?: string;
  disabledWhenAllSelected?: boolean;
  error?: string;
  onChange?: () => void;
}

function firstFieldError(meta: { errors: unknown[] }): string | undefined {
  for (const err of meta.errors) {
    if (typeof err === "string") return err;
    if (
      err &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as { message: unknown }).message === "string"
    ) {
      return (err as { message: string }).message;
    }
  }
  return undefined;
}

export function OperationDaysField({
  form,
  requireAtLeastOne,
  className,
  toggleClassName,
  disabledWhenAllSelected = false,
  error,
  onChange,
}: OperationDaysFieldProps) {
  const { t } = useTranslation("admin");

  return (
    <form.Field
      name="operatingDaySelected"
      validators={{
        onSubmit: ({ value }: { value: boolean[] }) => {
          if (!requireAtLeastOne) return undefined;
          const arr = Array.isArray(value) ? value : [];
          if (!arr.some(Boolean)) {
            return t("validation.selectAtLeastOneOperatingDay");
          }
          return undefined;
        },
      }}
    >
      {(field: AnyFieldApi) => {
        const selected = (
          Array.isArray(field.state.value) ? field.state.value : []
        ) as boolean[];
        const padded = OPERATING_DAY_CODES.map((_, i) => Boolean(selected[i]));
        const allSelected = padded.every(Boolean);

        const setAll = (on: boolean) => {
          field.handleChange(OPERATING_DAY_CODES.map(() => on));
          onChange?.();
        };

        const toggleDay = (index: number) => {
          const next = OPERATING_DAY_CODES.map(
            (_, i) => padded[i] === true
          ) as boolean[];
          next[index] = !next[index];
          field.handleChange(next);
          onChange?.();
        };

        const err = firstFieldError(field.state.meta) ?? error;
        const allDaysId = "operating-days-all";
        const dayTogglesDisabled = disabledWhenAllSelected && allSelected;

        return (
          <div
            className={className ?? "flex w-full max-w-[384px] flex-col gap-1"}
          >
            <div className="flex h-6 w-full shrink-0 items-center justify-between gap-2">
              <Label className="text-sm font-semibold leading-6 text-foreground">
                {t("labels.operationDays")}
                {requireAtLeastOne ? (
                  <span className="text-[#f54a00]">*</span>
                ) : null}
              </Label>
              <div className="flex shrink-0 items-center gap-3">
                <Checkbox
                  id={allDaysId}
                  checked={allSelected}
                  onCheckedChange={(c) => setAll(c === true)}
                  aria-label={t("labels.allDays")}
                />
                <Label
                  htmlFor={allDaysId}
                  className="cursor-pointer text-sm font-semibold leading-6 text-foreground"
                >
                  {t("labels.allDays")}
                </Label>
              </div>
            </div>
            <div
              role="group"
              aria-label={t("labels.operationDays")}
              className="flex flex-wrap items-center gap-2"
            >
              {OPERATING_DAY_CODES.map((day, i) => (
                <Toggle
                  key={day}
                  pressed={padded[i]}
                  onPressedChange={() => toggleDay(i)}
                  variant="outline"
                  disabled={dayTogglesDisabled}
                  className={
                    toggleClassName ??
                    "h-9 w-12 text-xs data-[state=on]:bg-brand-red data-[state=on]:text-primary-foreground rounded-md! border! py-1.5 px-2"
                  }
                  aria-label={t(`labels.weekdayShort.${day}`)}
                >
                  {t(`labels.weekdayShort.${day}`)}
                </Toggle>
              ))}
            </div>
            {err ? (
              <p className="text-xs font-medium text-destructive flex-1 leading-(--field-group-meta-line-height)">
                {err}
              </p>
            ) : null}
          </div>
        );
      }}
    </form.Field>
  );
}
