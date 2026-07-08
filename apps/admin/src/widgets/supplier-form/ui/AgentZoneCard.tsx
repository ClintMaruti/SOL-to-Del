import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckboxGroup,
  Input,
} from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import { supplierSubmitSchema } from "@/features/create-supplier/model/schema";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface AgentZoneCardProps {
  form: AnyFormApi;
}

export function AgentZoneCard({ form }: AgentZoneCardProps) {
  const { t } = useTranslation("admin");

  return (
    <Card id="other">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t("sections.agentZone")}</CardTitle>
        <form.Field name="visibilityForAgentZone">
          {(field: AnyFieldApi) => (
            <CheckboxGroup
              id="visibilityForAgentZone"
              checked={field.state.value}
              onCheckedChange={(checked) =>
                field.handleChange(checked === true)
              }
              label={t("labels.yesVisibleInAgentZone")}
            />
          )}
        </form.Field>
      </CardHeader>
      <CardContent>
        <FormField
          form={form}
          name="agentZoneId"
          label={t("labels.agentZoneId")}
          required={form.state.values.visibilityForAgentZone}
          validators={{ onChange: supplierSubmitSchema.shape.agentZoneId }}
        >
          {(field) => (
            <Input
              id="agentZoneId"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("placeholders.exampleId")}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
