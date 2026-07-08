import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  findCountryDestinationIdByName,
  getDestinationChildrenUnderCountry,
  useCountrySelectOptions,
  useDestinations,
} from "@/entities/destination";
import { useSupplierHeadOffice } from "@/entities/supplier-head-office";
import { supplierSubmitSchema } from "@/features/create-supplier/model/schema";
import { buildHierarchicalLocationOptionsFromDestinationTree } from "@/shared/lib/location-options";
import { DropdownSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface AddressLocationCardProps {
  form: AnyFormApi;
}

export function AddressLocationCard({ form }: AddressLocationCardProps) {
  const { t } = useTranslation("admin");
  const countryOptionGroups = useCountrySelectOptions("supplier");
  const countryId = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.values.countryId
  ) as string;
  const { data: destinations = [], isLoading: destinationsLoading } =
    useDestinations();
  const locationSubtree = useMemo(
    () => getDestinationChildrenUnderCountry(destinations, countryId),
    [destinations, countryId]
  );
  const locationOptions = useMemo(
    () => buildHierarchicalLocationOptionsFromDestinationTree(locationSubtree),
    [locationSubtree]
  );
  const locationOptionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const opt of locationOptions) {
      ids.add(opt.value);
    }
    return ids;
  }, [locationOptions]);

  useEffect(() => {
    if (destinationsLoading) return;
    const current = form.getFieldValue("locationId") as string | null;
    const trimmed = (current ?? "").trim();
    if (!trimmed && !(countryId ?? "").trim()) return;

    if (!(countryId ?? "").trim()) {
      if (trimmed) form.setFieldValue("locationId", null);
      return;
    }

    if (trimmed && !locationOptionIds.has(trimmed)) {
      form.setFieldValue("locationId", null);
    }
  }, [countryId, destinationsLoading, form, locationOptionIds]);

  const headOfficeId = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.values.headOfficeId
  ) as string;
  const { data: headOffice } = useSupplierHeadOffice(headOfficeId || null);

  const handleCopyHeadOfficeData = () => {
    if (!headOffice) return;
    form.setFieldValue(
      "countryId",
      findCountryDestinationIdByName(destinations, headOffice.country ?? "")
    );
    form.setFieldValue("city", headOffice.city ?? "");
    form.setFieldValue("postalCode", headOffice.postalCode ?? "");
    form.setFieldValue("streetAddress", headOffice.streetAddress ?? "");
    form.setFieldValue("poBox", headOffice.poBox ?? "");
  };

  return (
    <Card id="address-location">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("sections.addressAndLocation")}</CardTitle>
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
        <div className="form-row-wrap">
          <div className="form-field-wide">
            <FormField
              form={form}
              name="countryId"
              label={t("labels.country")}
              validators={{ onChange: supplierSubmitSchema.shape.countryId }}
            >
              {(field) => (
                <DropdownSelect
                  optionGroups={countryOptionGroups}
                  value={field.state.value || undefined}
                  onValueChange={(v: string) => field.handleChange(v)}
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
              validators={{ onChange: supplierSubmitSchema.shape.city }}
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
                onChange: supplierSubmitSchema.shape.postalCode,
              }}
            >
              {(field) => (
                <Input
                  id="postalCode"
                  inputMode="numeric"
                  value={field.state.value}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^\d\s-]/g, "");
                    field.handleChange(filtered);
                  }}
                  placeholder={t("placeholders.examplePostalCode")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
              )}
            </FormField>
          </div>
        </div>

        <div className="form-grid">
          <FormField
            form={form}
            name="streetAddress"
            label={t("labels.streetAddress")}
            validators={{ onChange: supplierSubmitSchema.shape.streetAddress }}
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
            name="poBox"
            label={t("labels.poBox")}
            validators={{ onChange: supplierSubmitSchema.shape.poBox }}
          >
            {(field) => (
              <Input
                id="poBox"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.examplePoBox")}
              />
            )}
          </FormField>
        </div>

        <div className="form-grid">
          <FormField
            form={form}
            name="locationId"
            label={t("labels.location")}
            validators={{ onChange: supplierSubmitSchema.shape.locationId }}
          >
            {(field) => {
              const locationDisabled =
                !(countryId ?? "").trim() || destinationsLoading;
              return (
                <DropdownSelect
                  id="locationId"
                  options={locationOptions}
                  isHierarchical
                  value={field.state.value || undefined}
                  onValueChange={(v) => field.handleChange(v)}
                  isSearchable
                  disabled={locationDisabled}
                  placeholder={
                    !(countryId ?? "").trim()
                      ? t("placeholders.selectCountryBeforeLocation")
                      : t("placeholders.selectLocation")
                  }
                  searchPlaceholder={t("placeholders.searchLocations")}
                  emptyMessage={t("placeholders.noLocationsFound")}
                  searchAriaLabel={t("placeholders.searchLocations")}
                />
              );
            }}
          </FormField>
          <div className="form-grid-compact">
            <FormField
              form={form}
              name="latitude"
              label={t("labels.latitude")}
              validators={{ onChange: supplierSubmitSchema.shape.latitude }}
            >
              {(field) => (
                <Input
                  id="latitude"
                  type="number"
                  inputMode="decimal"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleLatitude")}
                />
              )}
            </FormField>
            <FormField
              form={form}
              name="longitude"
              label={t("labels.longitude")}
              validators={{ onChange: supplierSubmitSchema.shape.longitude }}
            >
              {(field) => (
                <Input
                  id="longitude"
                  type="number"
                  inputMode="decimal"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.exampleLongitude")}
                />
              )}
            </FormField>
          </div>
        </div>

        <div className="form-grid">
          <FormField
            form={form}
            name="closestAirstrip"
            label={t("labels.closestAirstrip")}
            validators={{
              onChange: supplierSubmitSchema.shape.closestAirstrip,
            }}
          >
            {(field) => (
              <Input
                id="closestAirstrip"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleAirstrip")}
              />
            )}
          </FormField>
          <div className="form-grid-compact">
            <FormField
              form={form}
              name="airstripLatitude"
              label={t("labels.latitude")}
              validators={{
                onChange: supplierSubmitSchema.shape.airstripLatitude,
              }}
            >
              {(field) => (
                <Input
                  id="airstripLatitude"
                  type="number"
                  step="any"
                  value={field.state.value === 0 ? "" : field.state.value}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.handleChange(v === "" ? 0 : parseFloat(v) || 0);
                  }}
                  placeholder={t("placeholders.exampleLatitude")}
                />
              )}
            </FormField>
            <FormField
              form={form}
              name="airstripLongitude"
              label={t("labels.longitude")}
              validators={{
                onChange: supplierSubmitSchema.shape.airstripLongitude,
              }}
            >
              {(field) => (
                <Input
                  id="airstripLongitude"
                  type="number"
                  step="any"
                  value={field.state.value === 0 ? "" : field.state.value}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.handleChange(v === "" ? 0 : parseFloat(v) || 0);
                  }}
                  placeholder={t("placeholders.exampleLongitude")}
                />
              )}
            </FormField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
