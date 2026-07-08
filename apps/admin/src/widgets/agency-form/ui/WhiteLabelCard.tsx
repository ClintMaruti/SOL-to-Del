import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckboxGroup,
  Separator,
  Textarea,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface WhiteLabelCardProps {
  form: AnyFormApi;
}

export function WhiteLabelCard({ form }: WhiteLabelCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const needsWhiteLabel = useStore(form.store, (state: unknown) => {
    const s = state as { values?: { needsWhiteLabel?: boolean } };
    return s?.values?.needsWhiteLabel ?? false;
  });

  return (
    <Card id="other" className="border-b-0 rounded-b-none">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between pb-2">
        <CardTitle>{t("sections.whiteLabel")}</CardTitle>
        <form.Field name="needsWhiteLabel">
          {(field: {
            state: { value: boolean };
            handleChange: (v: boolean) => void;
          }) => (
            <CheckboxGroup
              id="needsWhiteLabel"
              checked={field.state.value}
              onCheckedChange={(checked) =>
                field.handleChange(checked === true)
              }
              label={t("labels.yesWhiteLabel")}
            />
          )}
        </form.Field>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          form={form}
          name="whiteLabelNote"
          label={t("labels.note")}
          required={needsWhiteLabel}
          validators={{
            onSubmit: ({ value }: { value: string }) =>
              needsWhiteLabel && !(value ?? "").trim()
                ? t("validation.whiteLabelNoteRequired")
                : undefined,
          }}
        >
          {(field) => (
            <Textarea
              id="whiteLabelNote"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("common:placeholders.typeInstructions")}
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
