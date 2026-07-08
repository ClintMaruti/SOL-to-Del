import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import type { PromotionFormTravelDateRange } from "@/entities/promotion";
import { createPromotionTravelDateRangeFormValue } from "@/features/create-promotion";
import { clearFormScopedOnSubmitFieldErrorsByPrefix } from "@/shared/lib/form";
import { FormMessage, type AnyFormApi } from "@/shared/ui";

import { usePromotionFieldErrorsByPrefix } from "../lib/usePromotionFieldErrors";
import { PromotionDateCellHeader } from "./PromotionDateCellHeader";
import { PromotionDateRangeField } from "./PromotionDateRangeField";
import { PromotionRelativeRangeField } from "./PromotionRelativeRangeField";
import { TravelDateRow } from "./TravelDateRow";

interface TravelDatesGridProps {
  form: AnyFormApi;
}

export function TravelDatesGrid({ form }: TravelDatesGridProps) {
  const { t } = useTranslation(["admin", "common"]);
  const values = useStore(form.store, (state) => {
    const formState = state as {
      values: {
        travelDates: PromotionFormTravelDateRange[];
        bookingWindow: {
          from: string;
          to: string;
        };
      };
    };

    return formState.values;
  });

  const travelDateErrors = usePromotionFieldErrorsByPrefix(form, "travelDates");
  const bookingWindowErrors = usePromotionFieldErrorsByPrefix(
    form,
    "bookingWindow"
  );
  const bookingWindowRelativeErrors = usePromotionFieldErrorsByPrefix(
    form,
    "bookingWindowRelative"
  );

  const addTravelDate = () => {
    form.setFieldValue("travelDates", [
      ...values.travelDates,
      createPromotionTravelDateRangeFormValue(),
    ]);
  };

  const removeTravelDate = (index: number) => {
    clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");

    if (values.travelDates.length === 1) {
      form.setFieldValue("travelDates", [
        createPromotionTravelDateRangeFormValue(),
      ]);
      return;
    }

    form.setFieldValue(
      "travelDates",
      values.travelDates.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const clearBookingWindowRelative = () => {
    clearFormScopedOnSubmitFieldErrorsByPrefix(form, "bookingWindowRelative");
    form.setFieldValue("bookingWindowRelative.fromDays", null);
    form.setFieldValue("bookingWindowRelative.toDays", null);
  };

  return (
    <section className="space-y-2">
      <div className="overflow-hidden rounded-[6px] border border-border-tertiary bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <PromotionDateCellHeader
            label={t("admin:labels.travelDates")}
            required
            className="border-r border-border-tertiary"
          />
          <PromotionDateCellHeader
            label={t("admin:labels.bookingWindow")}
            required
            className="border-r border-border-tertiary"
          />
          <PromotionDateCellHeader
            label={t("admin:labels.bookingWindowRelative")}
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="border-r border-border-tertiary">
            {values.travelDates.map((row, index) => (
              <TravelDateRow
                key={row.id}
                form={form}
                row={row}
                index={index}
                isLastRow={index === values.travelDates.length - 1}
                canRemove={values.travelDates.length > 1}
                onAdd={addTravelDate}
                onRemove={() => removeTravelDate(index)}
              />
            ))}
          </div>

          <div className="border-r border-border-tertiary">
            <div className="flex h-full min-h-9 flex-col justify-start">
              <PromotionDateRangeField
                label={t("admin:labels.bookingWindow")}
                from={values.bookingWindow.from}
                to={values.bookingWindow.to}
                pickerVariant="calendar"
                onChange={(fromValue, toValue) => {
                  clearFormScopedOnSubmitFieldErrorsByPrefix(
                    form,
                    "bookingWindow"
                  );
                  form.setFieldValue("bookingWindow.from", fromValue);
                  form.setFieldValue("bookingWindow.to", toValue);
                }}
                hasError={bookingWindowErrors.length > 0}
              />
            </div>
          </div>

          <div className="flex h-full min-h-9 flex-col justify-start">
            <PromotionRelativeRangeField
              form={form}
              hasError={bookingWindowRelativeErrors.length > 0}
              onClear={clearBookingWindowRelative}
            />
          </div>
        </div>
      </div>

      {travelDateErrors.length > 0 ? (
        <FormMessage errors={travelDateErrors} />
      ) : null}
      {bookingWindowErrors.length > 0 ? (
        <FormMessage errors={bookingWindowErrors} />
      ) : null}
      {bookingWindowRelativeErrors.length > 0 ? (
        <FormMessage errors={bookingWindowRelativeErrors} />
      ) : null}
    </section>
  );
}
