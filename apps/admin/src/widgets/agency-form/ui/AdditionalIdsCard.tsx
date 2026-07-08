import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface AdditionalIdsCardProps {
  form: AnyFormApi;
}

export function AdditionalIdsCard({ form }: AdditionalIdsCardProps) {
  const { t } = useTranslation("admin");
  return (
    <Card className="border-t-0 rounded-none border-b-0 rounded-b-none">
      <CardHeader className="pb-2">
        <CardTitle>{t("sections.additionalIds")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="form-grid-compact">
          <FormField form={form} name="kenXeroId" label={t("labels.kenXeroId")}>
            {(field) => (
              <Input
                id="kenXeroId"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>

          <FormField form={form} name="rwXeroId" label={t("labels.rwXeroId")}>
            {(field) => (
              <Input
                id="rwXeroId"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </FormField>

          <FormField form={form} name="tzXeroId" label={t("labels.tzXeroId")}>
            {(field) => (
              <Input
                id="tzXeroId"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </FormField>

          <FormField form={form} name="znzXeroId" label={t("labels.znzXeroId")}>
            {(field) => (
              <Input
                id="znzXeroId"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </FormField>
        </div>
      </CardContent>
      <div className="px-6">
        <Separator className="mx-auto" />
      </div>
    </Card>
  );
}
