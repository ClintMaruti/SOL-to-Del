import { Input, Textarea, cn } from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

import type { OptionFormFieldErrors } from "../model/apiValidationErrors";
import {
  areOperatingDaysRequiredForServiceType,
  areTimesRequiredForServiceType,
  isScheduleServiceType,
} from "../model/operating-days";

import { OperationDaysField } from "./OperationDaysField";
import { OptionTimeField } from "./OptionTimeField";
import { TitleField } from "./TitleField";

interface OptionFormProps {
  form: AnyFormApi;
  /** Unique per service option so fields are not duplicated in the DOM when several cards mount */
  htmlIdPrefix: string;
  serviceType: string | undefined;
  variant?: "card" | "sheet";
  fieldErrors?: OptionFormFieldErrors;
  onFieldChange?: (field: keyof OptionFormFieldErrors) => void;
}

export function OptionForm({
  form,
  serviceType,
  htmlIdPrefix,
  variant = "card",
  fieldErrors = {},
  onFieldChange,
}: OptionFormProps) {
  const { t } = useTranslation("admin");
  const schedule = isScheduleServiceType(serviceType);
  const timesRequired = areTimesRequiredForServiceType(serviceType);
  const operatingDaysRequired =
    areOperatingDaysRequiredForServiceType(serviceType);
  const isSheet = variant === "sheet";
  const sheetTextAreaClassName =
    serviceType === "flight"
      ? "min-h-[188px] resize-y rounded-[6px]"
      : "min-h-[286px] resize-y rounded-[6px]";

  if (isSheet) {
    return (
      <div className="flex flex-col gap-5">
        <div
          className={cn(
            "grid grid-cols-1 gap-2",
            serviceType === "flight" && "grid-cols-2"
          )}
        >
          <TitleField
            form={form}
            htmlIdPrefix={htmlIdPrefix}
            label={t("labels.optionName")}
            fieldError={fieldErrors.title}
            onFieldChange={onFieldChange}
            inputClassName="bg-[#f9fafb]"
          />
          {serviceType === "flight" ? (
            <FormField
              form={form}
              name="flightNumber"
              htmlIdPrefix={htmlIdPrefix}
              label={t("labels.flightNumber")}
              error={fieldErrors.flightNumber}
            >
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => {
                    onFieldChange?.("flightNumber");
                    field.handleChange(e.target.value);
                  }}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.flightNumberExample")}
                  className="bg-[#f9fafb]"
                />
              )}
            </FormField>
          ) : null}
        </div>

        {schedule ? (
          <>
            <div className="border-t border-dashed border-border" />
            <div className="grid grid-cols-2 gap-2">
              <OptionTimeField
                form={form}
                name="timeFrom"
                label={t("labels.timeFrom")}
                placeholder={t("placeholders.timeFromExample")}
                required={timesRequired}
                htmlIdPrefix={htmlIdPrefix}
                error={fieldErrors.timeFrom}
                onFieldChange={onFieldChange}
              />
              <OptionTimeField
                form={form}
                name="timeTo"
                label={t("labels.timeTo")}
                placeholder={t("placeholders.timeToExample")}
                required={timesRequired}
                htmlIdPrefix={htmlIdPrefix}
                error={fieldErrors.timeTo}
                onFieldChange={onFieldChange}
              />
            </div>
            <OperationDaysField
              form={form}
              requireAtLeastOne={operatingDaysRequired}
              error={fieldErrors.operatingDaySelected}
              onChange={() => onFieldChange?.("operatingDaySelected")}
              disabledWhenAllSelected
              className="flex w-full flex-col gap-2"
              toggleClassName="h-9 flex-1 rounded-[4px]! border! px-2 py-1.5 text-sm font-medium data-[state=on]:bg-brand-red data-[state=on]:text-primary-foreground disabled:opacity-100"
            />
          </>
        ) : null}

        <div className="border-t border-dashed border-border" />
        <FormField
          form={form}
          name="includes"
          htmlIdPrefix={htmlIdPrefix}
          label={t("labels.includes")}
          error={fieldErrors.includes}
        >
          {(field) => (
            <Textarea
              value={field.state.value}
              onChange={(e) => {
                onFieldChange?.("includes");
                field.handleChange(e.target.value);
              }}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.typeDescriptionHere")}
              className={sheetTextAreaClassName}
            />
          )}
        </FormField>

        <div className="border-t border-dashed border-border" />
        <FormField
          form={form}
          name="excludes"
          htmlIdPrefix={htmlIdPrefix}
          label={t("labels.excludes")}
          error={fieldErrors.excludes}
        >
          {(field) => (
            <Textarea
              value={field.state.value}
              onChange={(e) => {
                onFieldChange?.("excludes");
                field.handleChange(e.target.value);
              }}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.typeDescriptionHere")}
              className={sheetTextAreaClassName}
            />
          )}
        </FormField>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {schedule ? (
        <div className="flex flex-wrap items-start gap-2">
          <div className="form-field">
            <TitleField
              form={form}
              htmlIdPrefix={htmlIdPrefix}
              fieldError={fieldErrors.title}
              onFieldChange={onFieldChange}
            />
          </div>
          <div className="form-row-wrap">
            {/* Overnight ranges allowed (e.g. 11:20 PM to 12:15 AM); do not treat as invalid ordering. */}
            <div className="form-field-narrow">
              <OptionTimeField
                form={form}
                name="timeFrom"
                label={t("labels.timeFrom")}
                placeholder={t("placeholders.timeFromExample")}
                required={timesRequired}
                onFieldChange={onFieldChange}
                showValidationErrorState
              />
            </div>
            <div className="form-field-narrow">
              <OptionTimeField
                form={form}
                name="timeTo"
                label={t("labels.timeTo")}
                placeholder={t("placeholders.timeToExample")}
                required={timesRequired}
                onFieldChange={onFieldChange}
                showValidationErrorState
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 basis-[min(100%,24rem)] mt-1">
            <OperationDaysField
              form={form}
              requireAtLeastOne={operatingDaysRequired}
              error={fieldErrors.operatingDaySelected}
              onChange={() => onFieldChange?.("operatingDaySelected")}
            />
          </div>
          {serviceType === "flight" ? (
            <div className="form-field">
              <FormField
                form={form}
                name="flightNumber"
                label={t("labels.flightNumber")}
              >
                {(field) => (
                  <Input
                    id="flightNumber"
                    value={field.state.value}
                    onChange={(e) => {
                      onFieldChange?.("flightNumber");
                      field.handleChange(e.target.value);
                    }}
                    onBlur={field.handleBlur}
                    placeholder={t("placeholders.flightNumberExample")}
                  />
                )}
              </FormField>
            </div>
          ) : null}
        </div>
      ) : (
        <TitleField
          form={form}
          htmlIdPrefix={htmlIdPrefix}
          fieldError={fieldErrors.title}
          onFieldChange={onFieldChange}
        />
      )}

      <FormField
        form={form}
        name="includes"
        htmlIdPrefix={htmlIdPrefix}
        label={t("labels.includes")}
      >
        {(field) => (
          <Textarea
            rows={1}
            value={field.state.value}
            onChange={(e) => {
              onFieldChange?.("includes");
              field.handleChange(e.target.value);
            }}
            onBlur={field.handleBlur}
            placeholder={t("placeholders.enterIncludes")}
            className="max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-[60px]"
          />
        )}
      </FormField>

      <FormField
        form={form}
        name="excludes"
        htmlIdPrefix={htmlIdPrefix}
        label={t("labels.excludes")}
      >
        {(field) => (
          <Textarea
            rows={1}
            value={field.state.value}
            onChange={(e) => {
              onFieldChange?.("excludes");
              field.handleChange(e.target.value);
            }}
            onBlur={field.handleBlur}
            placeholder={t("placeholders.enterExcludes")}
            className="max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-[60px]"
          />
        )}
      </FormField>
    </div>
  );
}
