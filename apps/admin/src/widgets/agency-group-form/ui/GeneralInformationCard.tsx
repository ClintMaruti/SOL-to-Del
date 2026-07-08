import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import { createAgencyGroupSubmitSchema } from "@/features/create-agency-group/model/schema";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface GeneralInformationCardProps {
  form: AnyFormApi;
}

export function GeneralInformationCard({ form }: GeneralInformationCardProps) {
  const { t } = useTranslation("admin");
  return (
    <Card id="general-information" className="rounded-md p-6">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-base font-bold leading-6 text-neutral-900">
          {t("sections.generalInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <FormField
          form={form}
          name="name"
          label={t("labels.groupName")}
          required
          validators={{
            onChange: createAgencyGroupSubmitSchema.shape.name,
          }}
        >
          {(field) => (
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.enterGroupTitle")}
              className={cn(
                field.state.meta.errors.length > 0 && "border-destructive"
              )}
            />
          )}
        </FormField>

        <FormField
          form={form}
          name="description"
          label={t("tableHeaders.description")}
          validators={{
            onChange: createAgencyGroupSubmitSchema.shape.description,
          }}
        >
          {(field) => (
            <Textarea
              id="description"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.enterGroupDescription")}
              className={cn(
                "min-h-[60px]",
                field.state.meta.errors.length > 0 && "border-destructive"
              )}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
