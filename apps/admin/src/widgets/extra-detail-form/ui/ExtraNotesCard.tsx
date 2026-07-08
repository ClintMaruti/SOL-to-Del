import { Card, CardContent, CardHeader, CardTitle, Textarea } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { FormField, type AnyFormApi } from "@/shared/ui";

interface ExtraNotesCardProps {
  form: AnyFormApi;
}

export function ExtraNotesCard({ form }: ExtraNotesCardProps) {
  const { t } = useTranslation("admin");

  return (
    <Card id="extra-notes" className="scroll-mt-24 shadow-none">
      <CardHeader>
        <CardTitle>{t("extraDetail.sections.notes")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          form={form}
          name="notes.text"
          label={t("extraDetail.labels.notes")}
        >
          {(field) => (
            <Textarea
              rows={1}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t("extraDetail.placeholders.notes")}
              className="max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-[120px]"
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
