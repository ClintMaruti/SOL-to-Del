import { cn } from "@sol/ui";
import { CircleX, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PromotionFormTravelDateRange } from "@/entities/promotion";
import { clearFormScopedOnSubmitFieldErrorsByPrefix } from "@/shared/lib/form";
import { usePromotionFieldErrorsByPrefix } from "../lib/usePromotionFieldErrors";
import { PromotionDateRangeField } from "./PromotionDateRangeField";
import type { AnyFormApi } from "@/shared/ui";

interface TravelDateRowProps {
  form: AnyFormApi;
  row: PromotionFormTravelDateRange;
  index: number;
  isLastRow: boolean;
  canRemove: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

export function TravelDateRow({
  form,
  row,
  index,
  isLastRow,
  canRemove,
  onAdd,
  onRemove,
}: TravelDateRowProps) {
  const { t } = useTranslation(["admin", "common"]);
  const rowHasError =
    usePromotionFieldErrorsByPrefix(form, `travelDates[${index}]`).length > 0;

  return (
    <div className={cn("border-border-tertiary", !isLastRow && "border-b")}>
      <div className="flex items-center bg-white pr-3">
        <div className="min-w-0 flex-1">
          <PromotionDateRangeField
            label={t("admin:labels.travelDates")}
            from={row.from}
            to={row.to}
            pickerVariant="calendar"
            onChange={(fromValue, toValue) => {
              clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");
              form.setFieldValue(`travelDates[${index}].from`, fromValue);
              form.setFieldValue(`travelDates[${index}].to`, toValue);
            }}
            hasError={rowHasError}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-2">
          {canRemove ? (
            <button
              type="button"
              className="group inline-flex h-9 w-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-brand-red outline-none transition-colors duration-150 ease-out hover:text-brand-red focus-visible:outline-none"
              aria-label={t("admin:buttons.remove")}
              onClick={() => {
                clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");
                onRemove();
              }}
            >
              <CircleX className="size-4 transition-transform duration-150 ease-out group-hover:scale-110 group-focus-visible:scale-110" />
            </button>
          ) : null}
          <button
            type="button"
            className="group inline-flex h-9 w-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-brand-red outline-none transition-colors duration-150 ease-out hover:text-brand-red focus-visible:outline-none"
            aria-label={t("admin:buttons.add")}
            onClick={onAdd}
          >
            <Plus className="size-4 transition-transform duration-150 ease-out group-hover:scale-110 group-focus-visible:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
}
