import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  cn,
} from "@sol/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useLocations } from "@/entities/locations";
import { useServiceTypes } from "@/entities/service-type";
import type { SupplierService } from "@/entities/supplier-services";
import {
  hasFromToFields,
  hasLocationField,
  isToFieldRequired,
} from "@/features/create-supplier-service/model/schema";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField, VALIDATION_MESSAGES } from "@/shared/ui/form";

interface GeneralInformationCardProps {
  form: AnyFormApi;
  supplierService: SupplierService;
}

export function GeneralInformationCard({
  form,
  supplierService,
}: GeneralInformationCardProps) {
  const { t } = useTranslation("admin");
  const { data: serviceTypes = [] } = useServiceTypes();
  const matchedServiceType = serviceTypes.find(
    (st) => st.id === supplierService.serviceTypeId
  );
  const serviceTypeLabel = matchedServiceType?.displayName ?? "";
  const serviceTypeName = matchedServiceType?.name.toLowerCase() ?? "";

  const showLocation = hasLocationField(serviceTypeName);
  const showFromTo = hasFromToFields(serviceTypeName);
  const toRequired = isToFieldRequired(serviceTypeName);

  const { data: locations } = useLocations();
  const locationNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of locations ?? []) {
      map.set(loc.id, loc.name);
    }
    return map;
  }, [locations]);

  const displayLocationName = (id: string | undefined) => {
    if (!id?.trim()) return "";
    return locationNameById.get(id) ?? "";
  };

  return (
    <Card id="general-information" className="p-6">
      <CardHeader className="p-0 mb-3">
        <CardTitle className="text-base font-bold leading-6 text-neutral-900">
          {t("sections.generalInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        <div className="form-grid">
          <FormField
            form={form}
            name="name"
            label={t("labels.serviceName")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value.trim()
                  ? VALIDATION_MESSAGES.required(t("labels.serviceName"))
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                id="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("placeholders.exampleSupplierName")}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="alternativeName"
            label={t("labels.alternativeName")}
          >
            {(field) => (
              <Input
                id="alternativeName"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("placeholders.exampleCollection")}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="serviceTypeId"
            label={t("labels.serviceType")}
          >
            {() => (
              <Input id="serviceTypeId" value={serviceTypeLabel} readOnly />
            )}
          </FormField>

          {showLocation && (
            <FormField
              form={form}
              name="locationId"
              label={t("labels.location")}
            >
              {(field) => (
                <Input
                  id="locationId"
                  value={
                    displayLocationName(field.state.value) ||
                    t("placeholders.dash")
                  }
                  readOnly
                />
              )}
            </FormField>
          )}
          {showFromTo && (
            <>
              <FormField
                form={form}
                name="fromLocationId"
                label={t("labels.from")}
                required
              >
                {(field) => (
                  <Input
                    id="fromLocationId"
                    value={
                      displayLocationName(field.state.value) ||
                      t("placeholders.dash")
                    }
                    readOnly
                  />
                )}
              </FormField>
              <FormField
                form={form}
                name="toLocationId"
                label={t("labels.to")}
                required={toRequired}
              >
                {(field) => (
                  <Input
                    id="toLocationId"
                    value={
                      displayLocationName(field.state.value) ||
                      t("placeholders.dash")
                    }
                    readOnly
                  />
                )}
              </FormField>
            </>
          )}
        </div>

        <FormField
          form={form}
          name="description"
          label={t("labels.description")}
        >
          {(field) => (
            <Textarea
              id="description"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t("placeholders.serviceDescription")}
              className="min-h-[88px] resize-y"
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
