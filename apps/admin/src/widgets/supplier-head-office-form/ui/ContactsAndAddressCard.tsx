import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PhoneInput,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";
import z from "zod";

import { useCountrySelectOptions } from "@/entities/destination";
import {
  emailSchema,
  phoneOnChangeValidator,
  postalCodeSchema,
} from "@/shared/lib/validation";
import { optionalUrlSchema } from "@/shared/lib/validation/url";
import { DropdownSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface ContactsAndAddressCardProps {
  form: AnyFormApi;
}

export function ContactsAndAddressCard({ form }: ContactsAndAddressCardProps) {
  const { t } = useTranslation("admin");
  const countryOptionGroups = useCountrySelectOptions();
  return (
    <Card id="contacts-and-address">
      <CardHeader className="pb-4">
        <CardTitle>{t("sections.contactsAndAddress")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="form-grid">
          <FormField
            form={form}
            name="email"
            label={t("labels.email")}
            required
            validators={{
              onChange: emailSchema(),
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
            name="phoneNumber"
            label={t("labels.phone")}
            required
            validators={{
              onChange: phoneOnChangeValidator(t("validation.invalidPhone")),
            }}
          >
            {(field) => (
              <PhoneInput
                id="phoneNumber"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                invalid={field.state.meta.errors.length > 0}
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
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
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
                type="url"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleWebsite")}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
        </div>
        <div className="form-row-wrap">
          <div className="form-field-wide">
            <FormField form={form} name="country" label={t("labels.country")}>
              {(field) => (
                <DropdownSelect
                  optionGroups={countryOptionGroups}
                  value={field.state.value || undefined}
                  onValueChange={(v) => field.handleChange(v ?? "")}
                  isSearchable
                  placeholder={t("placeholders.selectCountry")}
                  searchPlaceholder={t("placeholders.searchCountries")}
                  emptyMessage={t("placeholders.noCountriesFound")}
                  id="country"
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                  searchAriaLabel={t("placeholders.searchCountries")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-wide">
            <FormField
              form={form}
              name="city"
              label={t("labels.city")}
              validators={{
                onChange: z
                  .string()
                  .max(
                    64,
                    t("validation.fieldMaxLength", {
                      field: t("labels.city"),
                      max: 64,
                    })
                  )
                  .optional(),
              }}
            >
              {(field) => (
                <Input
                  id="city"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleCity")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-narrow">
            <FormField
              form={form}
              name="postalCode"
              label={t("labels.postalCode")}
              validators={{
                onChange: postalCodeSchema(),
              }}
            >
              {(field) => (
                <Input
                  id="postalCode"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.examplePostalCode")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
              )}
            </FormField>
          </div>
        </div>
        <FormField
          form={form}
          name="streetAddress"
          label={t("labels.streetAddress")}
          validators={{
            onChange: z
              .string()
              .max(
                64,
                t("validation.fieldMaxLength", {
                  field: t("labels.streetAddress"),
                  max: 64,
                })
              )
              .optional(),
          }}
        >
          {(field) => (
            <Input
              id="streetAddress"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("placeholders.exampleAddress")}
              className={cn(
                field.state.meta.errors.length > 0 && "border-destructive"
              )}
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
