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

import { useSupplierServices } from "@/entities/supplier-services";
import { getServiceLabel } from "@/features/create-extra/lib/filter-services";
import { DropdownMultiSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField, VALIDATION_MESSAGES } from "@/shared/ui/form";

interface ExtraGeneralInformationCardProps {
  form: AnyFormApi;
  supplierId: string;
  /** When set (e.g. extra opened from a service), the service picker only lists this service. */
  scopedServiceId?: string;
}

export function ExtraGeneralInformationCard({
  form,
  supplierId,
  scopedServiceId,
}: ExtraGeneralInformationCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { data: services = [], isLoading: servicesLoading } =
    useSupplierServices(supplierId);

  const pickerServices = useMemo(() => {
    const scope = scopedServiceId?.trim();
    if (!scope) return services;
    return services.filter((s) => s.id === scope);
  }, [services, scopedServiceId]);

  const serviceOptions = useMemo(
    () =>
      pickerServices.map((s) => ({
        value: s.id,
        label: getServiceLabel(s),
        searchText: `${getServiceLabel(s)} ${s.name ?? ""} ${s.serviceName ?? ""}`,
      })),
    [pickerServices]
  );

  return (
    <Card id="extra-general-information" className="scroll-mt-24 shadow-none">
      <CardHeader>
        <CardTitle>{t("admin:extraDetail.sections.general")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="form-grid">
          <FormField
            form={form}
            name="title"
            label={t("admin:labels.title")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) => {
                if (!value?.trim()) {
                  return VALIDATION_MESSAGES.required(t("admin:labels.title"));
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <Input
                id="extra-title"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="serviceIds"
            label={t("admin:labels.services")}
          >
            {(field) => (
              <DropdownMultiSelect
                id="extra-serviceIds"
                options={serviceOptions}
                value={(field.state.value ?? []) as string[]}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
                isSearchable
                placeholder={t("admin:placeholders.selectServicesOptional")}
                searchPlaceholder={t("admin:placeholders.search")}
                emptyMessage={t("admin:empty.noServicesFound")}
                disabled={servicesLoading || pickerServices.length === 0}
                hasError={field.state.meta.errors.length > 0}
                className={cn(
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
              />
            )}
          </FormField>
        </div>

        <FormField
          form={form}
          name="description"
          label={t("admin:labels.description")}
        >
          {(field) => (
            <Textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={4}
              className="rounded-[6px] min-h-[100px]"
            />
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
