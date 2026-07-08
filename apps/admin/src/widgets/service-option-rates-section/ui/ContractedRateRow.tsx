import { Button, cn, Input } from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ContractedRate } from "@/entities/service-option-rate";
import { moneyAmountValueFormSchema } from "@/features/manage-service-option-rates/model/schema";
import { FormField, type AnyFormApi } from "@/shared/ui";

import type { ContractedRateValidationResult } from "../lib/validateContractedRates";

import { BookingWindowItem } from "./BookingWIndowItem";
import type { ContractedRatesTableProps } from "./ContractedRatesTable";
import { TableGridLayout } from "./ContractedRatesTableGrid";
import { TravelDateItem } from "./TravelDateItem";

export interface ContractedRateRowProps {
  form: AnyFormApi;
  htmlIdPrefix: string;
  crIndex: number;
  dates: ContractedRate["contractedRateDates"];
  groupResult: ContractedRateValidationResult;
  showValidation?: boolean;
  isLastGroup: boolean;
  /** Previous row showed net/rack errors (avoids double border with this row's first travel error). */
  prevGroupNetOrRackErrorVisible?: boolean;
  /** Previous row showed priority error (avoids double border with this row's priority error top). */
  prevGroupPriorityErrorVisible?: boolean;
  /** Omit gray border under the row wrapper when next row also shows priority error (keeps red outline continuous). */
  omitBottomRowWrapperBorder?: boolean;
  onAddDate?: ContractedRatesTableProps["onAddDate"];
  onRemoveTravelDate?: ContractedRatesTableProps["onRemoveTravelDate"];
  onTravelDatesChange?: ContractedRatesTableProps["onTravelDatesChange"];
  onWeekdaysChange?: ContractedRatesTableProps["onWeekdaysChange"];
  onRemoveContractedRate?: ContractedRatesTableProps["onRemoveContractedRate"];
  /** Total contracted-rate rows in this rate; used to hide delete when only one remains. */
  contractedRateCount: number;
}

export function ContractedRateRow({
  form,
  htmlIdPrefix,
  crIndex,
  dates,
  groupResult,
  showValidation,
  isLastGroup,
  onAddDate,
  onRemoveTravelDate,
  onTravelDatesChange,
  onWeekdaysChange,
  onRemoveContractedRate,
  contractedRateCount,
  prevGroupPriorityErrorVisible = false,
  omitBottomRowWrapperBorder = false,
}: ContractedRateRowProps) {
  const { t } = useTranslation("admin");
  const showTableErrors = !!showValidation;

  const { hasNetError } = groupResult;

  const showBookingWindowConflictChrome =
    showTableErrors &&
    (groupResult.hasBookingWindowError || groupResult.hasTravelOverlapError);

  const hasTravelDateTableErrors = groupResult.dateResults.some((dr) =>
    dr.travelDateErrors.some(Boolean)
  );

  const totalTravelDateRows = dates.reduce(
    (n, d) => n + d.travelDates.length,
    0
  );

  return (
    <div
      className={cn(
        !isLastGroup &&
          !omitBottomRowWrapperBorder &&
          "border-b border-gray-300"
      )}
    >
      <div>
        <TableGridLayout
          priority={
            <FormField
              form={form}
              name={`contractedRates[${crIndex}].priority`}
              htmlIdPrefix={htmlIdPrefix}
              required
              hideError={true}
              className="w-full h-full"
            >
              {(field) => (
                <Input
                  type="number"
                  squareFocus
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    field.handleChange(raw === "" ? undefined : Number(raw));
                  }}
                  onBlur={field.handleBlur}
                  className={cn(
                    "shadow-none pr-2 pl-4 py-1.5 w-full h-full border-none",
                    isLastGroup
                      ? "rounded-tl-none rounded-tr-none rounded-br-none rounded-bl-md"
                      : "rounded-none",
                    showTableErrors && groupResult.hasPriorityError
                      ? "bg-error-bg"
                      : "bg-white",
                    "hover:bg-gray-50 hover:border! hover:border-gray-200!",
                    "focus:border focus:bg-white focus:border-brand-red focus-visible:rounded-none! focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-offset-0! focus-visible:ring-brand-red!",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    "text-left"
                  )}
                />
              )}
            </FormField>
          }
          priorityClassName={cn(
            showTableErrors && groupResult.hasPriorityError
              ? cn(
                  "bg-error-bg border-r border-l border-b border-destructive!",
                  crIndex === 0 && "border-t border-destructive",
                  crIndex > 0 &&
                    !prevGroupPriorityErrorVisible &&
                    "border-t border-destructive",
                  isLastGroup && "overflow-hidden rounded-bl-md"
                )
              : cn(
                  "bg-gray-200",
                  isLastGroup && "overflow-hidden rounded-bl-md"
                )
          )}
          travelDates={dates
            .flatMap((date, dIdx) =>
              date.travelDates.map((travelDate, travelDateIndex) => ({
                dIdx,
                travelDateIndex,
                travelDate,
              }))
            )
            .map(({ dIdx, travelDateIndex, travelDate }) => {
              const travelDateInvalid =
                groupResult.dateResults[dIdx]?.travelDateErrors?.[
                  travelDateIndex
                ] ?? false;
              const showTravelDateError = !!showValidation && travelDateInvalid;
              return (
                <div
                  key={`t-${dIdx}-${travelDateIndex}`}
                  className={cn(
                    "h-9 border-b border-r",
                    cn(
                      "bg-gray-200 border-gray-300",
                      showBookingWindowConflictChrome &&
                        hasTravelDateTableErrors &&
                        !showTravelDateError &&
                        "border-r border-b-0 border-l-0 border-t-0 border-destructive!"
                    )
                  )}
                >
                  <TravelDateItem
                    travelDate={travelDate}
                    travelDateIndex={travelDateIndex}
                    hasError={showTravelDateError}
                    onAdd={() => onAddDate?.(crIndex, dIdx, travelDateIndex)}
                    onDatesChange={(from, to) =>
                      onTravelDatesChange?.(
                        crIndex,
                        dIdx,
                        travelDateIndex,
                        from,
                        to
                      )
                    }
                    onWeekdaysChange={(weekdays) =>
                      onWeekdaysChange?.(
                        crIndex,
                        dIdx,
                        travelDateIndex,
                        weekdays
                      )
                    }
                  />
                </div>
              );
            })}
          bookingWindow={
            <div className="flex items-stretch justify-between text-sm">
              <div className="flex min-w-0 flex-1 flex-col">
                <BookingWindowItem
                  form={form}
                  crIndex={crIndex}
                  numberOfTravelDates={totalTravelDateRows}
                  crFieldPrefix={`contractedRates[${crIndex}]`}
                  hasBookingWindowError={showBookingWindowConflictChrome}
                />
                {Array.from({
                  length: Math.max(totalTravelDateRows - 1, 0),
                }).map((_, fillerRowIdx) => (
                  <div
                    key={`bw-filler-${crIndex}-${fillerRowIdx}`}
                    className={cn(
                      "h-9 border-b",
                      showBookingWindowConflictChrome
                        ? "border-destructive bg-error-bg"
                        : "border-gray-300 bg-gray-200"
                    )}
                  />
                ))}
              </div>

              <div className="flex shrink-0 flex-col">
                {dates.map((date, dIndex) =>
                  date.travelDates.map((_, travelDateIndex) => {
                    const showRemoveTravelRowTrash = totalTravelDateRows > 1;
                    const showRemoveContractedRateTrash =
                      totalTravelDateRows === 1 &&
                      onRemoveContractedRate &&
                      contractedRateCount > 1;

                    if (
                      !showRemoveTravelRowTrash &&
                      !showRemoveContractedRateTrash
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={`bw-trash-${dIndex}-${travelDateIndex}`}
                        className={cn(
                          "w-[40px] h-9 box-border shrink-0 flex items-center justify-center",
                          "border-b border-l border-gray-300"
                        )}
                      >
                        <Button
                          size="icon-sm"
                          variant="default"
                          className={cn(
                            "h-9 min-h-9 w-full p-0 rounded-none bg-transparent text-brand-red",
                            "hover:bg-transparent"
                          )}
                          aria-label={
                            showRemoveTravelRowTrash
                              ? t("aria.removeTravelDateRow")
                              : t("aria.removeContractedRate")
                          }
                          onClick={() =>
                            showRemoveTravelRowTrash
                              ? onRemoveTravelDate?.(
                                  crIndex,
                                  dIndex,
                                  travelDateIndex
                                )
                              : onRemoveContractedRate?.(crIndex)
                          }
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          }
          bookingWindowClassName={cn(
            "bg-gray-200",
            showBookingWindowConflictChrome && "overflow-hidden"
          )}
          net={
            <FormField
              form={form}
              name={`contractedRates[${crIndex}].net.value`}
              htmlIdPrefix={htmlIdPrefix}
              required
              validators={{ onChange: moneyAmountValueFormSchema }}
              hideError={true}
              className="w-full min-w-0"
            >
              {(field) => (
                <Input
                  type="number"
                  squareFocus
                  value={field.state.value == null ? "" : field.state.value}
                  onChange={(e) => {
                    const raw = e.target.value;
                    field.handleChange(raw === "" ? null : Number(raw));
                  }}
                  onBlur={field.handleBlur}
                  className={cn(
                    "bg-white border-none shadow-none pr-2 pl-4 py-1.5 w-full h-9 rounded-none",
                    "focus:border focus:bg-white focus:border-brand-red focus-visible:rounded-none! focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-offset-0! focus-visible:ring-brand-red!",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    "text-right"
                  )}
                />
              )}
            </FormField>
          }
          netClassName={
            showTableErrors && hasNetError
              ? cn(
                  "bg-error-bg border-r! border-b! border-l! border-t border-destructive!"
                )
              : "border-t"
          }
          rack={
            <FormField
              form={form}
              name={`contractedRates[${crIndex}].rack.value`}
              htmlIdPrefix={htmlIdPrefix}
              required
              validators={{ onChange: moneyAmountValueFormSchema }}
              hideError={true}
              className="w-full min-w-0"
            >
              {(field) => (
                <Input
                  type="number"
                  squareFocus
                  value={field.state.value == null ? "" : field.state.value}
                  onChange={(e) => {
                    const raw = e.target.value;
                    field.handleChange(raw === "" ? null : Number(raw));
                  }}
                  onBlur={field.handleBlur}
                  className={cn(
                    "bg-white border-none shadow-none pr-2 pl-4 py-1.5 w-full h-9 rounded-none",
                    "focus:border focus:bg-white focus:border-brand-red focus-visible:rounded-none! focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-offset-0! focus-visible:ring-brand-red!",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    "text-right"
                  )}
                />
              )}
            </FormField>
          }
          rackClassName={
            showTableErrors && groupResult.hasRackError
              ? cn(
                  "bg-error-bg border-r! border-b border-l-0 border-t border-destructive!",
                  hasNetError ? "border-l-0" : "border-l!"
                )
              : "border-t"
          }
          sell={
            <FormField
              form={form}
              name={`contractedRates[${crIndex}].sell.value`}
              htmlIdPrefix={htmlIdPrefix}
              hideError={true}
              className="w-full min-w-0"
            >
              {(field) => (
                <Input
                  type="number"
                  squareFocus
                  value={field.state.value == null ? "" : field.state.value}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      field.handleChange(null);
                      return;
                    }
                    field.handleChange(Number(raw));
                  }}
                  onBlur={field.handleBlur}
                  className={cn(
                    "bg-white border-none shadow-none pr-2 pl-4 py-1.5 w-full h-9 rounded-none",
                    "hover:bg-gray-50 hover:border! hover:border-gray-200!",
                    "focus:border focus:bg-white focus:border-brand-red focus-visible:rounded-none! focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-offset-0! focus-visible:ring-brand-red!",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    "text-right"
                  )}
                />
              )}
            </FormField>
          }
          sellClassName={cn("border-t", isLastGroup && "rounded-br-md")}
        />
      </div>
    </div>
  );
}
