import { Card, CardContent, cn, Input, Label, Switch, Textarea } from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import { FormField, type AnyFormApi } from "@/shared/ui";

import { TravelDatesGrid } from "./TravelDatesGrid";

interface PromotionBasicsCardProps {
  form: AnyFormApi;
}

/** Matches FieldGroup label row height so the inline switch aligns with the input row. */
const FG_LABEL_ROW_SPACER =
  "h-[calc(var(--field-group-top-padding-y)*2+var(--field-group-label-line-height))] shrink-0";

export function PromotionBasicsCard({ form }: PromotionBasicsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const values = useStore(form.store, (state) => {
    const formState = state as {
      values: {
        isPartiallySupported: boolean;
      };
    };

    return formState.values;
  });

  return (
    <Card
      id="general-information"
      className="rounded-[6px] border-border-tertiary bg-white shadow-none"
    >
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_169px] lg:gap-10">
            <div className="min-w-0 flex-1">
              <FormField
                form={form}
                name="name"
                label={t("admin:labels.promotionName")}
                required
              >
                {(field) => (
                  <Input
                    id={field.name}
                    value={field.state.value as string}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("admin:placeholders.promotionName")}
                    aria-invalid={!field.state.meta.isValid}
                    className="h-9 border-border-tertiary bg-background-primary shadow-none"
                  />
                )}
              </FormField>
            </div>

            <form.Field name="isPartiallySupported">
              {(field: AnyFieldApi) => (
                <div className="w-full lg:w-[169px]">
                  <div className={`hidden lg:block ${FG_LABEL_ROW_SPACER}`} />
                  <div className="flex h-9 items-center gap-2">
                    <Label
                      htmlFor="promotion-partially-supported"
                      className="text-sm font-medium leading-6 text-text-primary"
                    >
                      {t("admin:labels.partiallySupported")}
                    </Label>
                    <Switch
                      id="promotion-partially-supported"
                      checked={Boolean(field.state.value)}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={t("admin:labels.partiallySupported")}
                    />
                  </div>
                </div>
              )}
            </form.Field>
          </div>

          <FormField
            form={form}
            name="note"
            label={t("admin:labels.note")}
            required={values.isPartiallySupported}
          >
            {(field) => (
              <Textarea
                id={field.name}
                rows={1}
                value={field.state.value as string}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("admin:placeholders.promotionNote")}
                aria-invalid={!field.state.meta.isValid}
                className={cn(
                  "max-w-full resize-y whitespace-pre-wrap rounded-[6px] border-border-tertiary bg-background-primary shadow-none [field-sizing:content] min-h-[120px]",
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
        </div>

        <TravelDatesGrid form={form} />
      </CardContent>
    </Card>
  );
}
