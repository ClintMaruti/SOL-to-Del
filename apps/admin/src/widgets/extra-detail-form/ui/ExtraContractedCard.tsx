import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ToggleGroup,
  ToggleGroupItem,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { Contract } from "@/entities/supplier-service-options/model/types";
import { contractValidityFromCatalog } from "@/features/edit-extra/lib/contract-validity-from-catalog";
import { ContractSelectWithValidityRow } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";

import { TravelDatesSection } from "./TravelDatesSection";

/** Programmatic contract-window sync must not mark the form dirty (navigation blocker). */
const PROGRAMMATIC_SET_OPTS = {
  dontUpdateMeta: true,
  dontValidate: true,
} as const;

interface ExtraContractedCardProps {
  form: AnyFormApi;
  contracts: Contract[];
}

export function ExtraContractedCard({
  form,
  contracts,
}: ExtraContractedCardProps) {
  const { t } = useTranslation("admin");

  const contractId = useStore(form.store, (s) => {
    const values = (s as { values: { contracted?: { contractId?: string } } })
      .values;
    return values.contracted?.contractId ?? "";
  });

  const contractedExtraId = useStore(form.store, (s) => {
    const id = (
      s as {
        values: { contracted?: { contractedExtraId?: string | null } };
      }
    ).values.contracted?.contractedExtraId;
    return id ?? null;
  });

  const validFromInForm = useStore(form.store, (s) => {
    const v = (s as { values: { contracted?: { validFrom?: string } } }).values
      .contracted?.validFrom;
    return v ?? "";
  });

  const validToInForm = useStore(form.store, (s) => {
    const v = (s as { values: { contracted?: { validTo?: string } } }).values
      .contracted?.validTo;
    return v ?? "";
  });

  const prevContractIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!contractId) {
      prevContractIdRef.current = contractId;
      form.setFieldValue("contracted.validFrom", "", PROGRAMMATIC_SET_OPTS);
      form.setFieldValue("contracted.validTo", "", PROGRAMMATIC_SET_OPTS);
      return;
    }

    const prev = prevContractIdRef.current;
    const userSwitchedContract =
      prev !== undefined && prev !== "" && prev !== contractId;

    prevContractIdRef.current = contractId;

    if (!contracts.length) return;

    const { validFrom: catalogValidFrom, validTo: catalogValidTo } =
      contractValidityFromCatalog(contracts, contractId);
    if (!catalogValidFrom && !catalogValidTo) return;

    const hasFormValidity =
      Boolean(validFromInForm.trim()) && Boolean(validToInForm.trim());

    if (!userSwitchedContract && hasFormValidity) {
      return;
    }

    const hydratedFromServer =
      contractedExtraId != null && String(contractedExtraId).trim() !== "";

    if (userSwitchedContract && hydratedFromServer) {
      form.setFieldValue(
        "contracted.contractedExtraId",
        null,
        PROGRAMMATIC_SET_OPTS
      );
      form.setFieldValue(
        "contracted.contractedExtraVersion",
        null,
        PROGRAMMATIC_SET_OPTS
      );
    }

    form.setFieldValue(
      "contracted.validFrom",
      catalogValidFrom,
      PROGRAMMATIC_SET_OPTS
    );
    form.setFieldValue(
      "contracted.validTo",
      catalogValidTo,
      PROGRAMMATIC_SET_OPTS
    );
  }, [
    contractId,
    contractedExtraId,
    contracts,
    form,
    validFromInForm,
    validToInForm,
  ]);

  return (
    <Card id="extra-contracted-extra" className="scroll-mt-24 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle>{t("extraDetail.sections.contractedExtra")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ContractSelectWithValidityRow
          form={form}
          contracts={contracts}
          contractFieldName="contracted.contractId"
          htmlIdPrefix="extra-contracted"
          displayValidFrom={validFromInForm}
          displayValidTo={validToInForm}
          contractRequired={false}
        />

        <div className="border-t border-border pt-4" />

        <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
          <FormField
            form={form}
            name="contracted.extraRequirement"
            useAriaLabelledBy
            label={t("extraDetail.labels.extraRequirement")}
            required
          >
            {(field) => (
              <ToggleGroup
                type="single"
                spacing={1}
                value={field.state.value}
                onValueChange={(v) => v && field.handleChange(v)}
                className="flex flex-wrap gap-1"
              >
                <ToggleGroupItem
                  value="mandatory"
                  className="h-9 rounded-sm border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                >
                  {t("extraDetail.extraRequirement.mandatory")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="optional"
                  className="h-9 rounded-sm border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                >
                  {t("extraDetail.extraRequirement.optional")}
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </FormField>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FormField
              form={form}
              name="contracted.chargeType"
              useAriaLabelledBy
              label={t("extraDetail.labels.chargeType")}
              required
            >
              {(field) => (
                <ToggleGroup
                  type="single"
                  spacing={1}
                  value={field.state.value}
                  onValueChange={(v) => v && field.handleChange(v)}
                  className="flex gap-1"
                >
                  <ToggleGroupItem
                    value="person"
                    className="h-9 rounded-[4px] border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                  >
                    {t("extraDetail.chargeType.person")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="unit"
                    className="h-9 rounded-[4px] border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                  >
                    {t("extraDetail.chargeType.unit")}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </FormField>

            <FormField
              form={form}
              name="contracted.timeUnit"
              useAriaLabelledBy
              label={t("extraDetail.labels.timeUnit")}
              required
            >
              {(field) => (
                <ToggleGroup
                  type="single"
                  spacing={1}
                  value={field.state.value}
                  onValueChange={(v) => v && field.handleChange(v)}
                  className="flex gap-1"
                >
                  <ToggleGroupItem
                    value="night"
                    className="h-9 rounded-[4px] border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                  >
                    {t("extraDetail.timeUnit.night")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="day"
                    className="h-9 rounded-[4px] border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                  >
                    {t("extraDetail.timeUnit.day")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="stay"
                    className="h-9 rounded-[4px] border border-border-tertiary bg-white px-2 py-1.5 text-sm font-medium leading-6 text-text-primary data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white"
                  >
                    {t("extraDetail.timeUnit.stay")}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </FormField>
          </div>
        </div>

        <TravelDatesSection form={form} />
      </CardContent>
    </Card>
  );
}
