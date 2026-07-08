import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckboxGroup,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useServiceTypes } from "@/entities/service-type";
import { useSupplierHeadOffices } from "@/entities/supplier-head-office";
import { STAR_RATING_VALUES } from "@/entities/suppliers/model/types";
import { supplierSubmitSchema } from "@/features/create-supplier/model/schema";
import { DropdownSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

import type { SupplierFormProps } from "../types";

interface GeneralInformationCardProps extends Pick<SupplierFormProps, "mode"> {
  form: AnyFormApi;
}

export function GeneralInformationCard({
  form,
  mode,
}: GeneralInformationCardProps) {
  const { t } = useTranslation("admin");
  const { data: headOffices = [] } = useSupplierHeadOffices();
  const { data: serviceTypes = [] } = useServiceTypes();
  const activeHeadOfficeOptions = useMemo(
    () =>
      headOffices
        .filter((ho) => ho.isActive)
        .map((ho) => ({ value: ho.id, label: ho.name })),
    [headOffices]
  );

  return (
    <Card id="general-information">
      <CardHeader>
        <CardTitle>{t("sections.generalInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="form-row-wrap">
          <div className="form-field-wide">
            <FormField
              form={form}
              name="name"
              label={t("labels.name")}
              required
              validators={{
                onChange: supplierSubmitSchema.shape.name,
              }}
            >
              {(field) => (
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.exampleSupplierProperty")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-wide">
            <FormField
              form={form}
              name="headOfficeId"
              label={t("labels.headOffice")}
              required
              validators={{
                onChange: supplierSubmitSchema.shape.headOfficeId,
              }}
            >
              {(field) => (
                <DropdownSelect
                  id="headOfficeId"
                  options={activeHeadOfficeOptions}
                  value={field.state.value || undefined}
                  onValueChange={(v) => field.handleChange(v)}
                  isSearchable
                  placeholder={t("placeholders.selectHeadOffice")}
                  searchPlaceholder={t("placeholders.searchHeadOffices")}
                  emptyMessage={t("placeholders.noHeadOfficesFound")}
                  disabled={mode === "edit"}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                  searchAriaLabel={t("placeholders.searchHeadOffices")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-narrow">
            <FormField
              form={form}
              name="code"
              label={t("labels.code")}
              validators={{ onChange: supplierSubmitSchema.shape.code }}
            >
              {(field) => (
                <Input
                  id="code"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleCode")}
                />
              )}
            </FormField>
          </div>
        </div>

        <div className="form-row-wrap">
          <div className="form-field-wide">
            <FormField
              form={form}
              name="additionalName"
              label={t("labels.additionalName")}
              validators={{
                onChange: supplierSubmitSchema.shape.additionalName,
              }}
            >
              {(field) => (
                <Input
                  id="additionalName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleCollection")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field-narrow">
            <FormField
              form={form}
              name="starRating"
              label={t("labels.starRating")}
              required
              validators={{
                onChange: supplierSubmitSchema.shape.starRating,
              }}
            >
              {(field) => {
                const starRatingLabels: Record<number, string> = {
                  1: t("starRating.oneStar"),
                  2: t("starRating.twoStars"),
                  3: t("starRating.threeStars"),
                  4: t("starRating.fourStars"),
                  5: t("starRating.fiveStars"),
                };
                return (
                  <Select
                    value={String(field.state.value)}
                    onValueChange={(v) => field.handleChange(Number(v))}
                  >
                    <SelectTrigger id="starRating" className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.selectRating")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t("labels.notRated")}</SelectItem>
                      {STAR_RATING_VALUES.slice(1).map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {starRatingLabels[r] ?? t("labels.notRated")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            </FormField>
          </div>
        </div>

        <div className="form-grid">
          <FormField
            form={form}
            name="serviceTypeId"
            label={t("labels.primaryServiceType")}
            required
          >
            {(field) => (
              <Select
                value={String(field.state.value)}
                onValueChange={(v) => field.handleChange(v)}
              >
                <SelectTrigger id="serviceTypeId" className="w-full">
                  <SelectValue
                    placeholder={t("placeholders.selectPrimaryServiceType")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((serviceType) => (
                    <SelectItem
                      key={serviceType.id}
                      value={serviceType.id}
                      className="capitalize"
                    >
                      {serviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField
            form={form}
            name="type"
            label={t("labels.type")}
            validators={{
              onChange: supplierSubmitSchema.shape.type,
            }}
          >
            {(field) => (
              <Input
                id="type"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("placeholders.exampleSafariTent")}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-base font-bold text-foreground">
            {t("labels.preferredSupplier")}
          </span>
          <form.Field name="preferredSupplier">
            {(field: AnyFieldApi) => (
              <CheckboxGroup
                id="preferredSupplier"
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(checked === true)
                }
                label={t("labels.yesPreferred")}
              />
            )}
          </form.Field>
        </div>
      </CardContent>
    </Card>
  );
}
