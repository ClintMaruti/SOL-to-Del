import { Card, CardContent, CardHeader, CardTitle } from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";
import { TagInput } from "@/shared/ui/TagInput";

interface BestForCardProps {
  form: AnyFormApi;
}

export function BestForCard({ form }: BestForCardProps) {
  const { t } = useTranslation("admin");

  return (
    <Card id="best-for" className="p-6">
      <CardHeader className="p-0 mb-3">
        <div className="">
          <CardTitle className="text-base font-bold leading-6 text-neutral-900">
            {t("sections.bestFor")}
          </CardTitle>
          <p className="text-sm text-neutral-600 font-medium">
            {t("sections.bestForDescription")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        <FormField form={form} name="tags" label={t("labels.tags")}>
          {(field) => (
            <TagInput
              id="tags"
              value={
                typeof field.state.value === "string" && field.state.value
                  ? field.state.value.split(",").map((tag) => tag.trim())
                  : []
              }
              onChange={(tags) => field.handleChange(tags.join(", "))}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.enterTags")}
              hasError={field.state.meta.errors.length > 0}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
