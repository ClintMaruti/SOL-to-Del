import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PhoneInput,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AgentFormData } from "@/features/edit-agent";

/** Minimal form data used by this card; shared by create and edit flows. */
type ContactsAddressFormData = Pick<
  AgentFormData,
  "primaryEmail" | "phone" | "alternateEmail"
>;

interface ContactsAddressErrors {
  primaryEmail?: string;
  phone?: string;
  alternateEmail?: string;
}

interface ContactsAddressCardProps {
  formData: ContactsAddressFormData;
  errors: ContactsAddressErrors;
  updateField: <K extends keyof ContactsAddressFormData>(
    field: K,
    value: ContactsAddressFormData[K]
  ) => void;
}

export function ContactsAddressCard({
  formData,
  errors,
  updateField,
}: ContactsAddressCardProps) {
  const { t } = useTranslation("admin");
  return (
    <Card id="contacts-address" className="rounded-md">
      <CardHeader>
        <CardTitle>{t("sections.contactsAndAddress")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="form-grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="agent-primaryEmail">
              {t("labels.email")}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agent-primaryEmail"
              type="email"
              value={formData.primaryEmail}
              onChange={(e) => updateField("primaryEmail", e.target.value)}
              placeholder={t("placeholders.exampleAgentEmail")}
              className={cn(errors.primaryEmail && "border-destructive")}
            />
            {errors.primaryEmail && (
              <p className="text-sm text-destructive">{errors.primaryEmail}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-phone">
              {t("labels.phone")}
              <span className="text-destructive">*</span>
            </Label>
            <PhoneInput
              id="agent-phone"
              type="tel"
              inputMode="tel"
              value={formData.phone}
              onChange={(value) => updateField("phone", value)}
              placeholder={t("placeholders.exampleAgentPhone")}
              error={errors.phone}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-alternateEmail">
            {t("labels.additionalEmail")}
          </Label>
          <Input
            id="agent-alternateEmail"
            type="email"
            value={formData.alternateEmail}
            onChange={(e) => updateField("alternateEmail", e.target.value)}
            placeholder={t("placeholders.exampleAlternateEmail")}
            className={cn(errors.alternateEmail && "border-destructive")}
          />
          {errors.alternateEmail && (
            <p className="text-sm text-destructive">{errors.alternateEmail}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
