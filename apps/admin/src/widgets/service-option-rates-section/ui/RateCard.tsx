import {
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  ToggleGroup,
  ToggleGroupItem,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { ChevronDown, Copy, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  ChargeTypeApi,
  ContractedRate,
  ServiceOptionRate,
  TimeUnitApi,
} from "@/entities/service-option-rate";
import {
  createEmptyContractedRate,
  planOptionRateTravelDateRemoval,
  rateFormSchema,
  useRateForm,
  type RateFormSubmitData,
} from "@/features/manage-service-option-rates";
import { clearFormScopedOnSubmitFieldErrorsByPrefix } from "@/shared/lib/form";
import { FormField } from "@/shared/ui";

import { ContractedRatesTable } from "./ContractedRatesTable";
import type { RatesSectionProps } from "./RatesSection";

type FieldMetaRecord = Record<string, { errors?: string[] } | undefined>;

function contractedRatesRootError(
  fieldMeta: FieldMetaRecord | undefined
): string | undefined {
  return fieldMeta?.contractedRates?.errors?.[0];
}

/** Figma Top Bar toggles: radius sm (4px), gap 1 (4px) between pills, brand #931115 when selected */
const RATE_CARD_TOGGLE_ITEM_CLASS =
  "shrink-0 rounded-sm border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-foreground shadow-none " +
  "hover:bg-white hover:text-foreground data-[state=on]:border-transparent data-[state=on]:bg-brand-red " +
  "data-[state=on]:text-white data-[state=on]:hover:bg-brand-red h-auto min-h-0 !rounded-sm " +
  "first:!rounded-sm last:!rounded-sm";

function rateFieldRequiredLabel(text: string) {
  return (
    <>
      {text}
      <span className="text-[#f54a00]" aria-hidden>
        *
      </span>
    </>
  );
}

interface RateCardProps extends Pick<
  RatesSectionProps,
  "contractId" | "contractValidity"
> {
  /** Unique per list row (persisted rate id or draft entry key) so DOM ids are not duplicated across cards. */
  htmlIdPrefix: string;
  initialData?: RateFormSubmitData;
  serviceOptionId?: string;
  rateId?: string;
  /** Deep link: force open when this persisted rate id matches. */
  expandRateId?: string | null;
  defaultOpen?: boolean;
  isDuplicateDraft?: boolean;
  onDuplicate?: (data: RateFormSubmitData) => void;
  onDraftRateCreated?: (created: ServiceOptionRate) => void;
}

export function RateCard({
  htmlIdPrefix,
  contractId,
  contractValidity,
  initialData,
  serviceOptionId,
  rateId,
  expandRateId = null,
  defaultOpen = false,
  isDuplicateDraft,
  onDuplicate,
  onDraftRateCreated,
}: RateCardProps) {
  const { t } = useTranslation("admin");
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (rateId && expandRateId && expandRateId === rateId) {
      setIsOpen(true);
    }
  }, [rateId, expandRateId]);

  const {
    form,
    contractedRateRowKeysWithSubmitErrors,
    handleSave,
    isSubmitting,
    isDirty,
    isSuccess,
  } = useRateForm(
    initialData,
    serviceOptionId,
    rateId,
    contractId,
    contractValidity,
    onDraftRateCreated,
    isDuplicateDraft,
    () => setIsOpen(true)
  );

  const contractedRates = useStore(
    form.store,
    (state: unknown) =>
      ((state as { values: RateFormSubmitData }).values?.contractedRates ??
        []) as ContractedRate[]
  );

  const fieldMeta = useStore(
    form.store,
    (state: unknown) => (state as { fieldMeta?: FieldMetaRecord }).fieldMeta
  );
  const contractedRatesSaveError = contractedRatesRootError(fieldMeta);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        id={rateId ? `service-option-rate-${rateId}` : undefined}
        className="rounded-md border border-gray-200 bg-white"
      >
        <div className="flex min-w-0 flex-wrap items-end gap-4 px-4 py-3">
          <div className="flex min-w-[min(100%,20rem)] flex-1 flex-wrap items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="outline-secondary"
                size="icon-md"
                aria-label={t("aria.toggleRateDetails")}
                className="h-16 shrink-0"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    isOpen ? "" : "-rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            <div className="flex min-w-[min(100%,18rem)] flex-1 flex-wrap items-center gap-3">
              <FormField
                form={form}
                name="name"
                htmlIdPrefix={htmlIdPrefix}
                label={rateFieldRequiredLabel(t("labels.rateName"))}
                required={false}
                className="min-h-[68px] min-w-[min(100%,14rem)] flex-1 basis-[16rem]"
                validators={{ onChange: rateFormSchema.shape.name }}
              >
                {(field) => (
                  <Input
                    value={field.state.value as string}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-required
                    className={cn(
                      "h-9 min-w-0 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium shadow-none",
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                )}
              </FormField>

              <div className="flex min-h-[68px] min-w-[min(100%,18rem)] flex-wrap items-end gap-3">
                <FormField
                  form={form}
                  name="chargeType"
                  htmlIdPrefix={htmlIdPrefix}
                  useAriaLabelledBy
                  label={rateFieldRequiredLabel(t("labels.chargeType"))}
                  required={false}
                  className="w-fit shrink-0"
                  validators={{ onChange: rateFormSchema.shape.chargeType }}
                >
                  {(field) => (
                    <ToggleGroup
                      type="single"
                      value={field.state.value as string}
                      onValueChange={(val) =>
                        val && field.handleChange(val as ChargeTypeApi)
                      }
                      variant="default"
                      className={cn(
                        "flex gap-1 border-0 bg-transparent p-0 shadow-none",
                        field.state.meta.errors.length > 0 &&
                          "ring-1 ring-destructive ring-offset-2"
                      )}
                    >
                      <ToggleGroupItem
                        value="Person"
                        className={RATE_CARD_TOGGLE_ITEM_CLASS}
                      >
                        {t("labels.person")}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="Unit"
                        className={RATE_CARD_TOGGLE_ITEM_CLASS}
                      >
                        {t("labels.unit")}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </FormField>

                <FormField
                  form={form}
                  name="timeUnit"
                  htmlIdPrefix={htmlIdPrefix}
                  useAriaLabelledBy
                  label={rateFieldRequiredLabel(t("labels.timeUnit"))}
                  required={false}
                  className="w-max shrink-0"
                  validators={{ onChange: rateFormSchema.shape.timeUnit }}
                >
                  {(field) => (
                    <ToggleGroup
                      type="single"
                      value={field.state.value as string}
                      onValueChange={(val) =>
                        val && field.handleChange(val as TimeUnitApi)
                      }
                      variant="default"
                      className={cn(
                        "flex flex-nowrap gap-1 border-0 bg-transparent p-0 shadow-none",
                        field.state.meta.errors.length > 0 &&
                          "ring-1 ring-destructive ring-offset-2"
                      )}
                    >
                      <ToggleGroupItem
                        value="Night"
                        className={RATE_CARD_TOGGLE_ITEM_CLASS}
                      >
                        {t("labels.night")}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="Day"
                        className={RATE_CARD_TOGGLE_ITEM_CLASS}
                      >
                        {t("labels.day")}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="Stay"
                        className={RATE_CARD_TOGGLE_ITEM_CLASS}
                      >
                        {t("labels.stay")}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </FormField>
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center self-end">
            <Button
              variant="outline-secondary"
              size="sm"
              className="h-9 gap-1 border-gray-200 px-4 py-2 text-sm font-medium text-[#525252] shadow-none"
              onClick={() => {
                const current = form.state.values;
                onDuplicate?.({
                  ...current,
                  version: undefined,
                  name: `${current.name} (copy)`,
                  contractedRates: current.contractedRates.map((cr) => ({
                    ...cr,
                    id: "",
                    clientRowKey: crypto.randomUUID(),
                    version: undefined,
                    contractedRateDates: cr.contractedRateDates.map((d) => ({
                      ...d,
                      id: "",
                      version: undefined,
                    })),
                  })) as ContractedRate[],
                } as RateFormSubmitData);
              }}
            >
              <Copy className="h-4 w-4 shrink-0" />
              {t("buttons.duplicateRate")}
            </Button>
          </div>
        </div>

        {/* Collapsible content */}
        <div className="bg-background-primary">
          <CollapsibleContent>
            {contractedRates.length > 0 && (
              <div className="border-t border-border">
                <ContractedRatesTable
                  form={form}
                  htmlIdPrefix={htmlIdPrefix}
                  contractedRates={contractedRates}
                  contractValidity={contractValidity}
                  contractedRateRowKeysWithSubmitErrors={
                    contractedRateRowKeysWithSubmitErrors
                  }
                  onAddDate={(crIndex, dateIndex, travelDateIndex) =>
                    form.insertFieldValue(
                      `contractedRates[${crIndex}].contractedRateDates[${dateIndex}].travelDates`,
                      travelDateIndex + 1,
                      { travelDateFrom: "", travelDateTo: "", weekdays: "" }
                    )
                  }
                  onRemoveTravelDate={(crIndex, dateIndex, travelDateIndex) => {
                    const removalPlan = planOptionRateTravelDateRemoval(
                      contractedRates[crIndex]?.contractedRateDates ?? [],
                      dateIndex,
                      travelDateIndex
                    );

                    clearFormScopedOnSubmitFieldErrorsByPrefix(
                      form,
                      `contractedRates[${crIndex}].contractedRateDates`
                    );

                    if (removalPlan.removeWholeContractedRateDate) {
                      void form.removeFieldValue(
                        `contractedRates[${crIndex}].contractedRateDates`,
                        dateIndex
                      );
                      return;
                    }

                    void form.removeFieldValue(
                      `contractedRates[${crIndex}].contractedRateDates[${dateIndex}].travelDates`,
                      travelDateIndex
                    );
                  }}
                  onTravelDatesChange={(
                    crIndex,
                    dateIndex,
                    travelDateIndex,
                    from,
                    to
                  ) => {
                    form.setFieldValue(
                      `contractedRates[${crIndex}].contractedRateDates[${dateIndex}].travelDates[${travelDateIndex}].travelDateFrom`,
                      from
                    );
                    form.setFieldValue(
                      `contractedRates[${crIndex}].contractedRateDates[${dateIndex}].travelDates[${travelDateIndex}].travelDateTo`,
                      to
                    );
                  }}
                  onWeekdaysChange={(
                    crIndex,
                    dateIndex,
                    travelDateIndex,
                    weekdays
                  ) =>
                    form.setFieldValue(
                      `contractedRates[${crIndex}].contractedRateDates[${dateIndex}].travelDates[${travelDateIndex}].weekdays`,
                      weekdays
                    )
                  }
                  onRemoveContractedRate={(crIndex) =>
                    form.removeFieldValue("contractedRates", crIndex)
                  }
                />
              </div>
            )}

            {/* Footer */}
            <div
              className={cn(
                "px-4 pb-4",
                contractedRates.length > 0 ? "pt-0" : "pt-4"
              )}
            >
              {contractedRatesSaveError && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                  {contractedRatesSaveError}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    form.pushFieldValue(
                      "contractedRates",
                      createEmptyContractedRate()
                    )
                  }
                  disabled={!contractId}
                >
                  <Plus className="h-4 w-4" />
                  {t("buttons.addContractRate")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isSuccess && !isDirty ? "outline" : "default"}
                  className={cn(
                    isSuccess && !isDirty
                      ? "gap-1 text-sm font-medium text-neutral-900 bg-gray-300 border-gray-300 hover:bg-gray-300 focus-visible:border-gray-300 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none"
                      : "bg-brand-red text-primary-foreground hover:bg-brand-red/90 focus-visible:border-transparent",
                    "disabled:cursor-not-allowed"
                  )}
                  disabled={!contractId || !isDirty}
                  isLoading={isSubmitting}
                  onClick={handleSave}
                >
                  {isSuccess && !isDirty
                    ? t("buttons.saved")
                    : t("buttons.save")}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}
