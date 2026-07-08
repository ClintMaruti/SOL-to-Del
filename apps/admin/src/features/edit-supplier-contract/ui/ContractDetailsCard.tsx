import {
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@sol/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAgencyGroups } from "@/entities/agency-group";
import { ANY_AGENCY_GROUP_VALUE } from "@/features/create-supplier-contract/model/schema";
import {
  isOptionalValidUrl,
  optionalUrlSchema,
} from "@/shared/lib/validation/url";
import { DatePickerGridInput } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField, FormMessage, VALIDATION_MESSAGES } from "@/shared/ui/form";

interface ContractDetailsCardProps {
  form: AnyFormApi;
  schemaError?: string;
  agencyGroupLabel?: string;
  agencyGroupId?: string | null;
}

export function ContractDetailsCard({
  form,
  schemaError,
  agencyGroupLabel,
  agencyGroupId,
}: ContractDetailsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { data: agencyGroups = [] } = useAgencyGroups();
  const persistedAgencyGroupValue = agencyGroupId ?? ANY_AGENCY_GROUP_VALUE;
  const agencyGroupOptions = useMemo(() => {
    const activeGroups = agencyGroups.filter((group) => group.isActive);
    if (
      agencyGroupId &&
      !activeGroups.some((group) => group.id === agencyGroupId)
    ) {
      return [
        {
          id: agencyGroupId,
          name: agencyGroupLabel ?? agencyGroupId,
        },
        ...activeGroups,
      ];
    }
    return activeGroups;
  }, [agencyGroupId, agencyGroupLabel, agencyGroups]);

  return (
    <Card id="contract-details" className="rounded-[6px]">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1 basis-[220px] space-y-2">
            <FormField
              form={form}
              name="name"
              label={t("admin:labels.contract")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value.trim()
                    ? VALIDATION_MESSAGES.required(t("admin:labels.contract"))
                    : undefined,
              }}
            >
              {(field) => (
                <Input
                  id="contract-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("admin:placeholders.contractNameExample")}
                  aria-invalid={!field.state.meta.isValid}
                />
              )}
            </FormField>
          </div>

          <div className="min-w-0 flex-1 basis-[180px] space-y-2">
            <FormField
              form={form}
              name="agencyGroupId"
              label={t("admin:labels.agencyGroup")}
            >
              {(field) => (
                <Select
                  value={persistedAgencyGroupValue}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled
                >
                  <SelectTrigger id={field.name} className="w-full bg-white/70">
                    <SelectValue
                      placeholder={t("admin:placeholders.selectAgencyGroup")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_AGENCY_GROUP_VALUE}>
                      {t("admin:labels.anyScope")}
                    </SelectItem>
                    {agencyGroupOptions.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <div className="min-w-0 flex-1 basis-[260px] space-y-2">
            <FormField
              form={form}
              name="link"
              label={t("admin:labels.linkToTheFile")}
              validators={{
                onChange: optionalUrlSchema(t("admin:validation.invalidUrl")),
              }}
            >
              {(field) => (
                <Input
                  id="contract-link"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("admin:placeholders.linkToFileExample")}
                  className={cn(
                    field.state.value?.trim() &&
                      isOptionalValidUrl(field.state.value) &&
                      "text-link hover:underline"
                  )}
                />
              )}
            </FormField>
          </div>

          <div className="min-w-0 flex-1 basis-[150px] space-y-2 lg:w-[150px] lg:flex-none lg:basis-auto">
            <FormField
              form={form}
              name="validFrom"
              label={t("admin:labels.validFrom")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value
                    ? VALIDATION_MESSAGES.required(t("admin:labels.validFrom"))
                    : undefined,
              }}
            >
              {(field) => (
                <DatePickerGridInput
                  id={field.name}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder={t("common:placeholders.selectDate")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive",
                    "bg-white/70"
                  )}
                />
              )}
            </FormField>
          </div>

          <div className="min-w-0 flex-1 basis-[150px] space-y-2 lg:w-[150px] lg:flex-none lg:basis-auto">
            <FormField
              form={form}
              name="validTo"
              label={t("admin:labels.validTo")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value
                    ? VALIDATION_MESSAGES.required(t("admin:labels.validTo"))
                    : undefined,
              }}
            >
              {(field) => (
                <DatePickerGridInput
                  id={field.name}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder={t("common:placeholders.selectDate")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive",
                    "bg-white/70"
                  )}
                />
              )}
            </FormField>
          </div>
        </div>

        {schemaError && (
          <div
            id="form-schema-error"
            className="rounded-md bg-destructive/10 p-3 mt-2"
            role="alert"
          >
            <FormMessage message={schemaError} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
