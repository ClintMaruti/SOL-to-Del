import { Card, CardContent, CardHeader, CardTitle, Input } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { supplierSubmitSchema } from "@/features/create-supplier/model/schema";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface GeneralPolicyCardProps {
  form: AnyFormApi;
}

export function GeneralPolicyCard({ form }: GeneralPolicyCardProps) {
  const { t } = useTranslation("admin");

  return (
    <Card id="general-policy">
      <CardHeader>
        <CardTitle>{t("sections.generalPolicy")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="form-row-wrap">
          <div className="form-field-narrow">
            <FormField
              form={form}
              name="checkIn"
              label={t("labels.checkIn")}
              validators={{
                onChange: supplierSubmitSchema.shape.checkIn,
              }}
            >
              {(field) => (
                <Input
                  id="checkIn"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleTime")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-narrow">
            <FormField
              form={form}
              name="checkOut"
              label={t("labels.checkOut")}
              validators={{
                onChange: supplierSubmitSchema.shape.checkOut,
              }}
            >
              {(field) => (
                <Input
                  id="checkOut"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleTime")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-wide">
            <FormField
              form={form}
              name="pickUp"
              label={t("labels.pickUp")}
              validators={{
                onChange: supplierSubmitSchema.shape.pickUp,
              }}
            >
              {(field) => (
                <Input
                  id="pickUp"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleSupplierName")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-wide">
            <FormField
              form={form}
              name="dropOff"
              label={t("labels.dropOff")}
              validators={{
                onChange: supplierSubmitSchema.shape.dropOff,
              }}
            >
              {(field) => (
                <Input
                  id="dropOff"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleSupplierName")}
                />
              )}
            </FormField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
