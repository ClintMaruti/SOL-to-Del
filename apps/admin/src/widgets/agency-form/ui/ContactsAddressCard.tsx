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

import { useCountrySelectOptions } from "@/entities/destination";
import { agencySubmitSchema } from "@/features/create-agency/model/schema";
import {
  emailSchema,
  phoneOnChangeValidator,
  phoneOnSubmitValidator,
  postalCodeSchema,
} from "@/shared/lib/validation";
import { DropdownSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface ContactsAddressCardProps {
  form: AnyFormApi;
}

export function ContactsAddressCard({ form }: ContactsAddressCardProps) {
  const { t } = useTranslation("admin");
  const countryOptionGroups = useCountrySelectOptions();

  return (
    <Card id="contacts">
      <CardHeader>
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
            name="phone"
            label={t("labels.phone")}
            required
            validators={{
              onChange: phoneOnChangeValidator(
                t("validation.invalidPhone", {
                  defaultValue:
                    "Enter a valid international number, e.g. +254 712 345 678",
                })
              ),
              onSubmit: phoneOnSubmitValidator(
                t("validation.required", {
                  field: t("labels.phoneNumber"),
                })
              ),
            }}
          >
            {(field) => (
              <PhoneInput
                id="phone"
                type="tel"
                inputMode="tel"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                placeholder={t("placeholders.examplePhone")}
                invalid={field.state.meta.errors.length > 0}
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
                  searchPlaceholder={t("placeholders.searchCountries")}
                  emptyMessage={t("placeholders.noCountriesFound")}
                  id="country"
                  placeholder={t("placeholders.selectCountry")}
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
              validators={{ onChange: agencySubmitSchema.shape.city }}
            >
              {(field) => (
                <Input
                  id="city"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleCity")}
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

        <div className="grid grid-cols-1 gap-2">
          <FormField
            form={form}
            name="streetAddress"
            label={t("labels.streetAddress")}
            validators={{
              onChange: agencySubmitSchema.shape.streetAddress,
            }}
          >
            {(field) => (
              <Input
                id="streetAddress"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleAddress")}
              />
            )}
          </FormField>
          <FormField
            form={form}
            name="website"
            label={t("labels.website")}
            validators={{ onChange: agencySubmitSchema.shape.website }}
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
        </div>
      </CardContent>
    </Card>
  );
}
