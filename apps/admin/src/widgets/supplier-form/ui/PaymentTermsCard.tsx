import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Input,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  paymentTermEntrySchema,
  supplierSubmitSchema,
} from "@/features/create-supplier/model/schema";
import type { PaymentTermEntry } from "@/features/create-supplier/model/types";
import { DEFAULT_PAYMENT_TERM } from "@/features/create-supplier/model/useCreateSupplierForm";
import { DatePickerGridInput } from "@/shared/ui/DatePicker";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface PaymentTermsCardProps {
  form: AnyFormApi;
}

export function PaymentTermsCard({ form }: PaymentTermsCardProps) {
  const { t } = useTranslation("admin");
  const paymentTerms = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.values.paymentTerms
  ) as PaymentTermEntry[];

  const handleAddPaymentTerm = () => {
    const newTerm: PaymentTermEntry =
      paymentTerms.length === 0
        ? { ...DEFAULT_PAYMENT_TERM }
        : {
            name: "",
            travelDatesFrom: "",
            travelDatesTo: "",
            depositPercent: 20,
            balanceDueDays: 60,
          };
    form.setFieldValue("paymentTerms", [...paymentTerms, newTerm]);
  };

  const handleRemovePaymentTerm = (index: number) => {
    // Default payment term (index 0) is not removable
    if (index === 0) return;
    form.setFieldValue(
      "paymentTerms",
      paymentTerms.filter((_, i) => i !== index)
    );
  };

  return (
    <Card id="payment-terms">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("sections.paymentTerms")}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddPaymentTerm}
          className="text-brand-red hover:text-brand-red/80"
        >
          <Plus className="size-4 mr-1 text-brand-red" />
          {t("buttons.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {paymentTerms.map((_, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted/60 p-4 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground py-1.5">
                {t("labels.paymentTermsN", { n: index + 1 })}
              </p>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePaymentTerm(index)}
                  disabled={index === 0}
                  className="text-brand-red hover:text-brand-red/80 px-3 py-2 gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-4 mr-1 text-brand-red" />
                  {t("buttons.remove")}
                </Button>
              )}
            </div>
            <div className="form-row-wrap">
              <div className="form-field-wide">
                <FormField
                  form={form}
                  name={`paymentTerms[${index}].name`}
                  label={t("labels.title")}
                  validators={{
                    onChange: paymentTermEntrySchema.shape.name,
                  }}
                >
                  {(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t("placeholders.exampleStandard")}
                      className="bg-white/70"
                    />
                  )}
                </FormField>
              </div>
              <div className="form-grid-compact form-field-wide">
                <FormField
                  form={form}
                  name={`paymentTerms[${index}].travelDatesFrom`}
                  label={t("labels.travelDatesFrom")}
                  validators={{
                    onChange: paymentTermEntrySchema.shape.travelDatesFrom,
                  }}
                >
                  {(field) => (
                    <DatePickerGridInput
                      value={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                      placeholder={t("placeholders.selectStartDate")}
                      className={cn(
                        field.state.meta.errors.length > 0 &&
                          "border-destructive",
                        "bg-white/70"
                      )}
                    />
                  )}
                </FormField>
                <FormField
                  form={form}
                  name={`paymentTerms[${index}].travelDatesTo`}
                  label={t("labels.travelDatesTo")}
                  validators={{
                    onChange: paymentTermEntrySchema.shape.travelDatesTo,
                  }}
                >
                  {(field) => (
                    <DatePickerGridInput
                      value={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                      placeholder={t("placeholders.selectEndDate")}
                      className={cn(
                        field.state.meta.errors.length > 0 &&
                          "border-destructive",
                        "bg-white/70"
                      )}
                    />
                  )}
                </FormField>
              </div>
            </div>
            <div className="form-grid">
              <FormField
                form={form}
                name={`paymentTerms[${index}].depositPercent`}
                label={t("labels.depositPercent")}
                validators={{
                  onChange: paymentTermEntrySchema.shape.depositPercent,
                }}
              >
                {(field) => (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value, 10))
                    }
                    placeholder={t("placeholders.exampleNumber")}
                    className="bg-white/70"
                  />
                )}
              </FormField>
              <FormField
                form={form}
                name={`paymentTerms[${index}].balanceDueDays`}
                label={t("labels.balanceDueDays")}
                validators={{
                  onChange: paymentTermEntrySchema.shape.balanceDueDays,
                }}
              >
                {(field) => (
                  <Input
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value, 10))
                    }
                    placeholder={t("placeholders.exampleDays")}
                    className="bg-white/70"
                  />
                )}
              </FormField>
            </div>
          </div>
        ))}
        <FormField
          form={form}
          name={`taxCode`}
          label={t("labels.taxCode")}
          validators={{
            onChange: supplierSubmitSchema.shape.taxCode,
          }}
        >
          {(field) => (
            <Input
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("placeholders.exampleTaxCode")}
              className={cn(
                field.state.meta.errors.length > 0 && "border-destructive"
              )}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
