import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ContractedRate } from "@/entities/service-option-rate";
import { getContractedRateRowKey } from "@/features/manage-service-option-rates/model/contractedRateRowKey";
import type { RateContractValidity } from "@/features/manage-service-option-rates/model/schema";
import { type AnyFormApi } from "@/shared/ui";

import { computeContractedRateErrors } from "../lib/validateContractedRates";

import { ContractedRateRow } from "./ContractedRateRow";
import { Cell, TableGridLayout } from "./ContractedRatesTableGrid";

export interface ContractedRatesTableProps {
  form: AnyFormApi;
  /** Namespaces DOM ids for nested fields so multiple rate cards on the page do not collide. */
  htmlIdPrefix: string;
  contractedRates: ContractedRate[];
  contractValidity?: RateContractValidity | null;
  onAddDate?: (
    crIndex: number,
    dateIndex: number,
    travelDateIndex: number
  ) => void;
  onRemoveTravelDate?: (
    crIndex: number,
    dateIndex: number,
    travelDateIndex: number
  ) => void;
  onTravelDatesChange?: (
    crIndex: number,
    dateIndex: number,
    travelDateIndex: number,
    from: string,
    to: string
  ) => void;
  onWeekdaysChange?: (
    crIndex: number,
    dateIndex: number,
    travelDateIndex: number,
    weekdays: string
  ) => void;
  onRemoveContractedRate?: (crIndex: number) => void;
  /** Rows that were present when save validation last failed; new rows stay clean until the next failed save. */
  contractedRateRowKeysWithSubmitErrors: Set<string> | null;
}

export function ContractedRatesTable({
  form,
  htmlIdPrefix,
  contractedRates,
  contractValidity,
  onAddDate,
  onRemoveTravelDate,
  onTravelDatesChange,
  onWeekdaysChange,
  onRemoveContractedRate,
  contractedRateRowKeysWithSubmitErrors,
}: ContractedRatesTableProps) {
  const { t } = useTranslation("admin");

  if (contractedRates.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("empty.noContractedRates")}
      </div>
    );
  }

  const errorResults = computeContractedRateErrors(
    contractedRates,
    contractValidity
  );

  const rowShowsSubmitErrors = (crIdx: number) =>
    contractedRateRowKeysWithSubmitErrors !== null &&
    contractedRateRowKeysWithSubmitErrors.has(
      getContractedRateRowKey(contractedRates[crIdx], crIdx)
    );

  const showContractValidityBanner = errorResults.some(
    (r, i) => rowShowsSubmitErrors(i) && r.hasTravelContractValidityError
  );

  const showConflictBanner = errorResults.some((r, i) => {
    if (!rowShowsSubmitErrors(i)) return false;
    const hasNonContractTravelDateError = r.dateResults.some((dr) =>
      dr.travelDateErrors.some(
        (hasError, travelDateIndex) =>
          hasError && !dr.travelDateContractValidityErrors[travelDateIndex]
      )
    );
    return (
      r.hasPriorityError ||
      r.hasTravelOverlapError ||
      hasNonContractTravelDateError
    );
  });

  const showNetRackBanner = errorResults.some(
    (r, i) => rowShowsSubmitErrors(i) && (r.hasNetError || r.hasRackError)
  );

  return (
    <div className=" p-4">
      {(showContractValidityBanner ||
        showConflictBanner ||
        showNetRackBanner) && (
        <div className="inline-flex flex-col mb-3 space-y-3">
          {showContractValidityBanner && (
            <div className="inline-flex items-center gap-3 rounded-md bg-error-bg px-4 py-3">
              <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
              <p className="text-sm font-bold text-destructive leading-5">
                {t("errors.contractedRatesOutsideContractValidity")}
              </p>
            </div>
          )}
          {showConflictBanner && (
            <div className="inline-flex items-center gap-3 rounded-md bg-error-bg px-4 py-3">
              <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
              <p className="text-sm font-bold text-destructive leading-5">
                {t("errors.contractedRatesConflict")}
              </p>
            </div>
          )}
          {showNetRackBanner && (
            <div className="inline-flex items-center gap-3 rounded-md bg-error-bg px-4 py-3">
              <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
              <p className="text-sm font-bold text-destructive leading-5">
                {t("errors.netAndRackPricesRequired")}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="w-full overflow-hidden rounded-md border border-gray-200">
        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-[56rem]">
            <TableGridLayout
              containerClassName="border-b border-border bg-gray-300"
              priorityClassName="rounded-tl-md"
              bookingWindowClassName="rounded-tr-md"
              priority={
                <Cell className="text-sm font-semibold text-neutral-900">
                  {t("labels.priority")}
                </Cell>
              }
              travelDates={
                <Cell className="text-sm font-semibold text-neutral-900">
                  {t("labels.travelDates")}
                </Cell>
              }
              bookingWindow={
                <Cell className="text-sm font-semibold text-neutral-900">
                  {t("labels.bookingWindow")}
                </Cell>
              }
            />

            {contractedRates.map((cr, crIdx) => {
              const dates = cr.contractedRateDates;
              const isLastGroup = crIdx === contractedRates.length - 1;
              const groupResult = errorResults[crIdx];

              const prevGroupNetOrRackErrorVisible =
                crIdx > 0 &&
                rowShowsSubmitErrors(crIdx - 1) &&
                (errorResults[crIdx - 1].hasNetError ||
                  errorResults[crIdx - 1].hasRackError);

              const prevGroupPriorityErrorVisible =
                crIdx > 0 &&
                rowShowsSubmitErrors(crIdx - 1) &&
                errorResults[crIdx - 1].hasPriorityError;

              const omitBottomRowWrapperBorder =
                crIdx < contractedRates.length - 1 &&
                rowShowsSubmitErrors(crIdx) &&
                groupResult.hasPriorityError &&
                rowShowsSubmitErrors(crIdx + 1) &&
                errorResults[crIdx + 1].hasPriorityError;

              return (
                <ContractedRateRow
                  key={cr.id || `cr-${crIdx}`}
                  form={form}
                  htmlIdPrefix={htmlIdPrefix}
                  crIndex={crIdx}
                  dates={dates}
                  groupResult={groupResult}
                  showValidation={rowShowsSubmitErrors(crIdx)}
                  isLastGroup={isLastGroup}
                  prevGroupNetOrRackErrorVisible={
                    prevGroupNetOrRackErrorVisible
                  }
                  prevGroupPriorityErrorVisible={prevGroupPriorityErrorVisible}
                  omitBottomRowWrapperBorder={omitBottomRowWrapperBorder}
                  onAddDate={onAddDate}
                  onRemoveTravelDate={onRemoveTravelDate}
                  onTravelDatesChange={onTravelDatesChange}
                  onWeekdaysChange={onWeekdaysChange}
                  onRemoveContractedRate={onRemoveContractedRate}
                  contractedRateCount={contractedRates.length}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
