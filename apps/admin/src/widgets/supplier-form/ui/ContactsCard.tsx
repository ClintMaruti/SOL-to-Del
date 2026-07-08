import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PhoneInput,
  Textarea,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useSupplierHeadOffice } from "@/entities/supplier-head-office";
import { supplierSubmitSchema } from "@/features/create-supplier/model/schema";
import { emailSchema, phoneOnChangeValidator } from "@/shared/lib/validation";
import { optionalUrlSchema } from "@/shared/lib/validation/url";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface ContactsCardProps {
  form: AnyFormApi;
}

export function ContactsCard({ form }: ContactsCardProps) {
  const { t } = useTranslation("admin");

  const headOfficeId = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.values.headOfficeId
  ) as string;
  const { data: headOffice } = useSupplierHeadOffice(headOfficeId || null);

  const handleCopyHeadOfficeData = () => {
    if (!headOffice) return;
    form.setFieldValue("email", headOffice.email ?? "");
    form.setFieldValue("phone", headOffice.phoneNumber ?? "");
    form.setFieldValue("additionalEmail", headOffice.additionalEmail ?? "");
    form.setFieldValue("website", headOffice.website ?? "");
  };

  return (
    <Card id="contacts">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("sections.contacts")}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyHeadOfficeData}
          disabled={!headOffice}
        >
          {t("labels.copyHeadOfficeData")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="form-grid">
          <FormField
            form={form}
            name="email"
            label={t("labels.email")}
            validators={{
              onChange: supplierSubmitSchema.shape.email,
            }}
          >
            {(field) => (
              <Input
                id="email"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("placeholders.exampleEmail")}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
          <FormField
            form={form}
            name="phone"
            label={t("labels.phone")}
            validators={{
              onChange: phoneOnChangeValidator(t("validation.invalidPhone")),
            }}
          >
            {(field) => (
              <PhoneInput
                id="phone"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
              />
            )}
          </FormField>
        </div>

        <div className="form-grid">
          <FormField
            form={form}
            name="additionalEmail"
            label={t("labels.additionalEmail")}
            validators={{
              onChange: z.union([z.literal(""), emailSchema()]),
            }}
          >
            {(field) => (
              <Input
                id="additionalEmail"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleEmail")}
              />
            )}
          </FormField>
          <FormField
            form={form}
            name="secondAdditionalEmail"
            label={t("labels.secondAdditionalEmail")}
            validators={{
              onChange: z.union([z.literal(""), emailSchema()]),
            }}
          >
            {(field) => (
              <Input
                id="secondAdditionalEmail"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleEmail")}
              />
            )}
          </FormField>
        </div>

        <div className="form-grid">
          <FormField
            form={form}
            name="website"
            label={t("labels.website")}
            validators={{
              onChange: optionalUrlSchema(t("validation.invalidUrl")),
            }}
          >
            {(field) => (
              <Input
                id="website"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleWebsite")}
              />
            )}
          </FormField>
          <FormField
            form={form}
            name="liveAvailabilityCheck"
            label={t("labels.liveAvailabilityCheck")}
          >
            {(field) => (
              <Input
                id="liveAvailabilityCheck"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleWebsite")}
              />
            )}
          </FormField>
        </div>

        <FormField
          form={form}
          name="otherCommunicationChannels"
          label={t("labels.otherCommunicationChannels")}
        >
          {(field) => (
            <Textarea
              id="otherCommunicationChannels"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("placeholders.exampleMessaging")}
              rows={3}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
