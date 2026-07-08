import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckboxGroup,
  Input,
  Separator,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";
import { agencySubmitSchema } from "@/features/create-agency/model/schema";

interface AgentZoneCardProps {
  form: AnyFormApi;
}

export function AgentZoneCard({ form }: AgentZoneCardProps) {
  const { t } = useTranslation("admin");
  const agentZoneVisible = useStore(form.store, (state: unknown) => {
    const s = state as { values?: { agentZoneVisible?: boolean } };
    return s?.values?.agentZoneVisible ?? false;
  });

  return (
    <Card className="rounded-none border-t-0 border-b-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t("sections.agentZone")}</CardTitle>
        <form.Field name="agentZoneVisible">
          {(field: {
            state: { value: boolean };
            handleChange: (v: boolean) => void;
          }) => (
            <CheckboxGroup
              id="agentZoneVisible"
              checked={field.state.value}
              onCheckedChange={(checked) =>
                field.handleChange(checked === true)
              }
              label={t("labels.yesVisibleInAgentZone")}
            />
          )}
        </form.Field>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          form={form}
          name="agentZoneId"
          label={t("labels.agentZoneId")}
          required={agentZoneVisible}
          validators={{
            onChange: agencySubmitSchema.shape.agentZoneId,
          }}
        >
          {(field) => (
            <Input
              id="agentZoneId"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={
                field.state.meta.errors.length > 0 ? "border-destructive" : ""
              }
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
