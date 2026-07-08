import { Input, ToggleGroup, ToggleGroupItem, cn } from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";

import { getServiceRateFieldError } from "../model/serviceRateFormErrors";
import type { ServiceRateFormValues } from "../model/schema";
import {
  SEGMENTED_TOGGLE_GROUP_CLASS,
  SEGMENTED_TOGGLE_ITEM_CLASS,
} from "./segmentedToggleClasses";

function requiredLabel(text: string) {
  return (
    <>
      {text}
      <span className="text-[#f54a00]" aria-hidden>
        *
      </span>
    </>
  );
}

interface ServiceRateFormFieldsProps {
  form: AnyFormApi;
}

export function ServiceRateFormFields({ form }: ServiceRateFormFieldsProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="flex flex-col gap-6">
      <form.Field name="name">
        {(field: AnyFieldApi) => {
          const error = getServiceRateFieldError(field);
          return (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-foreground">
                {requiredLabel(t("labels.rateName"))}
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={cn(
                  "rounded-[6px] bg-background-primary",
                  error && "border-destructive"
                )}
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          );
        }}
      </form.Field>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <form.Field name="chargeType">
          {(field: AnyFieldApi) => {
            const error = getServiceRateFieldError(field);
            return (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {requiredLabel(t("labels.chargeType"))}
                </span>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  value={field.state.value}
                  onValueChange={(v) => {
                    if (v)
                      field.handleChange(
                        v as ServiceRateFormValues["chargeType"]
                      );
                  }}
                  className={SEGMENTED_TOGGLE_GROUP_CLASS}
                >
                  <ToggleGroupItem
                    value="Person"
                    className={SEGMENTED_TOGGLE_ITEM_CLASS}
                  >
                    {t("extraDetail.chargeType.person")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Unit"
                    className={SEGMENTED_TOGGLE_ITEM_CLASS}
                  >
                    {t("extraDetail.chargeType.unit")}
                  </ToggleGroupItem>
                </ToggleGroup>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="timeUnit">
          {(field: AnyFieldApi) => {
            const error = getServiceRateFieldError(field);
            return (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {requiredLabel(t("labels.timeUnit"))}
                </span>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  value={field.state.value}
                  onValueChange={(v) => {
                    if (v)
                      field.handleChange(
                        v as ServiceRateFormValues["timeUnit"]
                      );
                  }}
                  className={SEGMENTED_TOGGLE_GROUP_CLASS}
                >
                  <ToggleGroupItem
                    value="Night"
                    className={SEGMENTED_TOGGLE_ITEM_CLASS}
                  >
                    {t("extraDetail.timeUnit.night")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Day"
                    className={SEGMENTED_TOGGLE_ITEM_CLASS}
                  >
                    {t("extraDetail.timeUnit.day")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Stay"
                    className={SEGMENTED_TOGGLE_ITEM_CLASS}
                  >
                    {t("extraDetail.timeUnit.stay")}
                  </ToggleGroupItem>
                </ToggleGroup>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
              </div>
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}
