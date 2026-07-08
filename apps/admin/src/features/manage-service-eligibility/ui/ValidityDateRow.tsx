import { Button, cn } from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DatePickerGridInput } from "@/shared/ui";

import { useValidityDateRow } from "../model/useValidityDateRow";

interface ValidityDateRowProps {
  dateId: string;
  from: string;
  to: string;
  eligibilityId: string;
  serviceId: string;
  saveAttempted?: boolean;
  disabled?: boolean;
  onUpdate: (id: string, updates: { from?: string; to?: string }) => void;
  onRemove: (id: string) => void;
  showHeaders?: boolean;
}

export function ValidityDateRow({
  dateId,
  from,
  to,
  eligibilityId,
  serviceId,
  saveAttempted,
  disabled,
  onUpdate,
  onRemove,
  showHeaders,
}: ValidityDateRowProps) {
  const { t } = useTranslation("admin");
  const { handleFromChange, handleToChange, hasError } = useValidityDateRow({
    dateId,
    from,
    to,
    eligibilityId,
    serviceId,
    saveAttempted,
    onUpdate,
  });

  return (
    <>
      {showHeaders && (
        <>
          <span className="py-1 text-sm font-semibold text-foreground">
            {t("labels.from")}
          </span>
          <span className="py-1 text-sm font-semibold text-foreground">
            {t("labels.to")}
          </span>
          <span />
        </>
      )}
      <DatePickerGridInput
        value={from}
        onChange={handleFromChange}
        placeholder={t("placeholders.selectStartDate")}
        className={cn(
          "w-full bg-white/70",
          hasError && "border-destructive bg-red-100"
        )}
        hasError={hasError}
        disabled={disabled}
      />
      <DatePickerGridInput
        value={to}
        onChange={handleToChange}
        placeholder={t("placeholders.selectEndDate")}
        className={cn(
          "w-full bg-white/70",
          hasError && "border-destructive bg-red-100"
        )}
        hasError={hasError}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(dateId)}
        className="h-8 w-8 self-center text-brand-red hover:text-brand-red"
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}
