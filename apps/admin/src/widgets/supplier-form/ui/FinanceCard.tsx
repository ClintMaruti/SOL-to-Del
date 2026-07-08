import { Card, CardContent, CardHeader, CardTitle, cn, Input } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { supplierSubmitSchema } from "@/features/create-supplier/model/schema";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface FinanceCardProps {
  form: AnyFormApi;
}

export function FinanceCard({ form }: FinanceCardProps) {
  const { t } = useTranslation("admin");

  return (
    <Card id="finance">
      <CardHeader>
        <CardTitle>{t("sections.finance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          <FormField
            form={form}
            name="xeroId"
            label={t("labels.xeroId")}
            validators={{ onChange: supplierSubmitSchema.shape.xeroId }}
          >
            {(field) => (
              <Input
                id="xeroId"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("placeholders.exampleAccount")}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
