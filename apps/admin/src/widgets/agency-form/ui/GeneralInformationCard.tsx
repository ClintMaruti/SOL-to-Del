import { Card, CardContent, CardHeader, CardTitle, Input, cn } from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAgencyGroups } from "@/entities/agency-group/api/useAgencyGroups";
import { useSafariPlanners } from "@/entities/safari-planners/api/useSafariPlanners";
import { useSourceMarkets } from "@/entities/source-market/api/useSourceMarkets";
import { agencySubmitSchema } from "@/features/create-agency/model/schema";
import { DropdownMultiSelect, DropdownSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

interface GeneralInformationCardProps {
  form: AnyFormApi;
}

type FieldMetaRecord = Record<string, { errors?: string[] } | undefined>;

function getFieldError(
  fieldMeta: FieldMetaRecord | undefined,
  fieldName: string
): string | undefined {
  const errors = fieldMeta?.[fieldName]?.errors;
  return errors?.length ? errors[0] : undefined;
}

export function GeneralInformationCard({ form }: GeneralInformationCardProps) {
  const { t } = useTranslation("admin");
  const fieldMeta = useStore(
    form.store,
    (state: unknown) => (state as { fieldMeta?: FieldMetaRecord }).fieldMeta
  );
  const { data: sourceMarkets = [] } = useSourceMarkets();
  const { data: agencyGroups = [], isLoading: isAgencyGroupsLoading } =
    useAgencyGroups();
  const { data: safariPlanners = [], isLoading: isSafariPlannersLoading } =
    useSafariPlanners();
  const activeSourceMarketOptions = useMemo(
    () =>
      sourceMarkets
        .filter((sm) => sm.isActive)
        .map((sm) => ({ value: sm.id, label: sm.name })),
    [sourceMarkets]
  );
  const agencyGroupOptions = useMemo(
    () =>
      agencyGroups
        .filter((g) => g.isActive)
        .map((g) => ({ value: g.id, label: g.name })),
    [agencyGroups]
  );

  return (
    <Card id="general">
      <CardHeader>
        <CardTitle>{t("sections.generalInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="form-row-wrap">
          <div className="form-field-wide">
            <FormField
              form={form}
              name="agencyName"
              label={t("labels.agencyName")}
              required
              error={getFieldError(fieldMeta, "agencyName")}
              validators={{
                onChange: agencySubmitSchema.shape.agencyName,
              }}
            >
              {(field) => (
                <Input
                  id="agencyName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.exampleAgencyName")}
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
              name="iataCode"
              label={t("labels.iataCode")}
              error={getFieldError(fieldMeta, "iataCode")}
            >
              {(field) => (
                <Input
                  id="iataCode"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("placeholders.enterIataCodeShort")}
                />
              )}
            </FormField>
          </div>
        </div>
        <div className="form-row-wrap">
          <div className="form-field-wide">
            <FormField
              form={form}
              name="agencyGroupIds"
              label={t("labels.agencyGroup")}
              required
              error={getFieldError(fieldMeta, "agencyGroupIds")}
              validators={{
                onChange: agencySubmitSchema.shape.agencyGroupIds,
              }}
            >
              {(field) => (
                <DropdownMultiSelect
                  options={agencyGroupOptions}
                  value={
                    Array.isArray(field.state.value) ? field.state.value : []
                  }
                  onValueChange={(v) => field.handleChange(v)}
                  onBlur={field.handleBlur}
                  isSearchable
                  placeholder={
                    isAgencyGroupsLoading
                      ? t("common:messages.loading")
                      : t("placeholders.selectAgencyGroups")
                  }
                  searchPlaceholder={t("placeholders.searchAgencyGroups")}
                  emptyMessage={t("placeholders.noAgencyGroupsFound")}
                  id="agencyGroupIds"
                  hasError={field.state.meta.errors.length > 0}
                  searchAriaLabel={t("placeholders.searchAgencyGroups")}
                />
              )}
            </FormField>
          </div>
          <div className="form-field">
            <FormField
              form={form}
              name="sourceMarket"
              label={t("labels.sourceMarket")}
              required
              error={getFieldError(fieldMeta, "sourceMarket")}
              validators={{
                onChange: agencySubmitSchema.shape.sourceMarket,
              }}
            >
              {(field) => {
                const currentId =
                  field.state.value != null ? String(field.state.value) : "";
                const selectedFromList = sourceMarkets.find(
                  (sm) =>
                    sm.id === currentId || (sm.code && sm.code === currentId)
                );
                const selectedOption =
                  currentId && selectedFromList
                    ? { value: currentId, label: selectedFromList.name }
                    : currentId
                      ? {
                          value: currentId,
                          label: `${t("labels.sourceMarket")} (${currentId.slice(0, 8)}…)`,
                        }
                      : null;
                const restOptions = activeSourceMarketOptions.filter(
                  (opt) => opt.value !== currentId
                );
                const sourceMarketOptions =
                  selectedOption != null
                    ? [selectedOption, ...restOptions]
                    : activeSourceMarketOptions;
                return (
                  <DropdownSelect
                    id="sourceMarket"
                    options={sourceMarketOptions}
                    value={currentId || undefined}
                    onValueChange={(v) => {
                      if (v && v !== currentId) field.handleChange(v);
                    }}
                    isSearchable
                    placeholder={t("placeholders.selectSourceMarket")}
                    searchPlaceholder={t("placeholders.searchSourceMarkets")}
                    emptyMessage={t("placeholders.noSourceMarketsFound")}
                    className={cn(
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                    searchAriaLabel={t("placeholders.searchSourceMarkets")}
                  />
                );
              }}
            </FormField>
          </div>
          <div className="form-field-wide">
            <FormField
              form={form}
              name="assignedSafariPlannerId"
              label={t("labels.assignedSafariPlanner")}
              required
              error={getFieldError(fieldMeta, "assignedSafariPlannerId")}
              validators={{
                onChange: agencySubmitSchema.shape.assignedSafariPlannerId,
              }}
            >
              {(field) => {
                const currentId =
                  field.state.value != null ? String(field.state.value) : "";
                const currentName = (
                  form.state.values as Record<string, unknown>
                ).assignedSafariPlannerName as string;

                const selectedFromList = safariPlanners.find(
                  (sp) => sp.id === currentId
                );

                const fallbackOption =
                  currentId && !selectedFromList && currentName
                    ? { value: currentId, label: currentName }
                    : null;

                const restOptions = safariPlanners
                  .filter((sp) => sp.id !== currentId)
                  .map((sp) => ({ value: sp.id, label: sp.userName }));

                const safariPlannerOptions = selectedFromList
                  ? [
                      {
                        value: selectedFromList.id,
                        label: selectedFromList.userName,
                      },
                      ...restOptions,
                    ]
                  : fallbackOption
                    ? [
                        fallbackOption,
                        ...safariPlanners.map((sp) => ({
                          value: sp.id,
                          label: sp.userName,
                        })),
                      ]
                    : safariPlanners.map((sp) => ({
                        value: sp.id,
                        label: sp.userName,
                      }));

                return (
                  <DropdownSelect
                    id="assignedSafariPlannerId"
                    options={safariPlannerOptions}
                    value={currentId || undefined}
                    onValueChange={(v) => {
                      if (v && v !== currentId) {
                        field.handleChange(v);
                        const planner = safariPlanners.find(
                          (sp) => sp.id === v
                        );
                        if (planner) {
                          form.setFieldValue(
                            "assignedSafariPlannerName",
                            planner.userName
                          );
                        }
                      }
                    }}
                    isSearchable
                    placeholder={
                      isSafariPlannersLoading
                        ? t("common:messages.loading")
                        : t("placeholders.selectAssignedSp")
                    }
                    searchPlaceholder={t("placeholders.searchSafariPlanners")}
                    emptyMessage={t("placeholders.noSafariPlannersFound")}
                    className={cn(
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                    searchAriaLabel={t("placeholders.searchSafariPlanners")}
                  />
                );
              }}
            </FormField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
