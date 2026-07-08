import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckboxGroup,
  Input,
  Textarea,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import {
  agencySubmitSchema,
  balanceDueDaysSchema,
  depositPercentSchema,
} from "@/features/create-agency/model/schema";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface PaymentTermsCardProps {
  form: AnyFormApi;
}

export function PaymentTermsCard({ form }: PaymentTermsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const hasCreditTerms = useStore(
    form.store,
    (state: any) => state.values.hasCreditTerms
  ) as boolean;

  return (
    <div id="terms">
      <Card className="border-b-0 rounded-b-none">
        <CardHeader>
          <CardTitle>{t("sections.paymentTerms")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="form-grid">
            <FormField
              form={form}
              name="depositPercent"
              label={t("labels.depositPercent")}
              validators={{
                onChange: depositPercentSchema,
              }}
            >
              {(field) => (
                <Input
                  id="depositPercent"
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </FormField>

            <FormField
              form={form}
              name="balanceDueDays"
              label={t("labels.balanceDueDays")}
              validators={{
                onChange: balanceDueDaysSchema,
              }}
            >
              {(field) => (
                <Input
                  type="number"
                  id="balanceDueDays"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </FormField>

            <FormField
              form={form}
              name="taxCode"
              label={t("labels.taxCode")}
              required
              validators={{
                onChange: agencySubmitSchema.shape.taxCode,
              }}
            >
              {(field) => (
                <Input
                  id="taxCode"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
              )}
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-0 rounded-t-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between mt-0 pt-0 pb-2">
          <CardTitle className="text-base">
            {t("sections.creditTerms")}
          </CardTitle>
          <form.Field name="hasCreditTerms">
            {(field: {
              state: { value: boolean };
              handleChange: (v: boolean) => void;
            }) => (
              <CheckboxGroup
                id="hasCreditTerms"
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(checked === true)
                }
                label={t("labels.yesCreditTerms")}
              />
            )}
          </form.Field>
        </CardHeader>
        <CardContent>
          <FormField
            form={form}
            name="creditTermsNote"
            label={t("labels.note")}
            required={hasCreditTerms}
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                hasCreditTerms && !value.trim()
                  ? t("validation.noteRequiredWhenCreditTerms")
                  : undefined,
            }}
          >
            {(field) => (
              <Textarea
                id="creditTermsNote"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("common:placeholders.typeInstructions")}
                className={cn(
                  hasCreditTerms &&
                    field.state.meta.errors.length > 0 &&
                    "border-destructive"
                )}
              />
            )}
          </FormField>
        </CardContent>
      </Card>
    </div>
  );
}
