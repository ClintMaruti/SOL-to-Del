import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import { FormField, type AnyFormApi } from "@/shared/ui";

interface AdditionalNotesCardProps {
  form: AnyFormApi;
}

export function AdditionalNotesCard({ form }: AdditionalNotesCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <Card className="border-t-0 rounded-t-none rounded-b-md">
      <CardHeader className="pb-2">
        <CardTitle>{t("sections.additionalNotes")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <FormField form={form} name="additionalNotes" label={t("labels.notes")}>
          {(field) => (
            <Textarea
              rows={1}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t("common:placeholders.typeInstructions")}
              className={cn(
                "max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-[120px]",
                field.state.meta.errors.length > 0 && "border-destructive"
              )}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
