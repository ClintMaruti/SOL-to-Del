import { Card, CardContent, CardHeader, CardTitle, Input, cn } from "@sol/ui";
import { useTranslation } from "react-i18next";
import z from "zod";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface GeneralInformationCardProps {
  form: AnyFormApi;
}

export function GeneralInformationCard({ form }: GeneralInformationCardProps) {
  const { t } = useTranslation("admin");
  return (
    <Card id="general-information">
      <CardHeader className="pb-4">
        <CardTitle>{t("sections.generalInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          form={form}
          name="name"
          label={t("labels.name")}
          required
          validators={{
            onChange: z
              .string({
                error: t("validation.required", { field: t("labels.name") }),
              })
              .trim()
              .nonempty(t("validation.required", { field: t("labels.name") }))
              .min(
                3,
                t("validation.fieldMinLengthContain", {
                  field: t("labels.name"),
                  min: 3,
                })
              )
              .max(
                64,
                t("validation.fieldMaxLength", {
                  field: t("labels.name"),
                  max: 64,
                })
              ),
          }}
        >
          {(field) => (
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.typeHeadOfficeName")}
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
