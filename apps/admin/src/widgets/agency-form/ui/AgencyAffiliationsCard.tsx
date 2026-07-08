import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Textarea,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface AgencyAffiliationsCardProps {
  form: AnyFormApi;
}

export function AgencyAffiliationsCard({ form }: AgencyAffiliationsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <Card className="border-t-0 rounded-t-none rounder-none border-b-0 rounded-b-none">
      <CardHeader className="pb-2">
        <CardTitle>{t("sections.agencyAffiliations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField form={form} name="agencyAffiliations">
          {(field) => (
            <Textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("common:placeholders.typeHere")}
            />
          )}
        </FormField>
      </CardContent>
      <div className="px-6">
        <Separator className="mx-auto" />
      </div>
    </Card>
  );
}
