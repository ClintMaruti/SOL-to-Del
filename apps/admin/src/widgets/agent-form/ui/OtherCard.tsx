import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Textarea,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AgentFormData } from "@/features/edit-agent";

/** Minimal form data used by this card; shared by create and edit flows. */
type OtherFormData = Pick<AgentFormData, "notes">;

interface OtherCardProps {
  formData: OtherFormData;
  updateField: <K extends keyof OtherFormData>(
    field: K,
    value: OtherFormData[K]
  ) => void;
}

export function OtherCard({ formData, updateField }: OtherCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <Card id="other" className="rounded-md">
      <CardHeader>
        <CardTitle>{t("sections.other")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="agent-notes">{t("labels.notes")}</Label>
          <Textarea
            id="agent-notes"
            rows={1}
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder={t("common:placeholders.typeInstructions")}
            className="max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-[120px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
