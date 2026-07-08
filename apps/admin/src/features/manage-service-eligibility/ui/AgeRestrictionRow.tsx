import { Button, RangeInputGroup } from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { AgeRestriction } from "@/entities/service-eligibility";

import { parseNonNegativeNumber } from "../model/parseNonNegativeNumber";

const NUM_INPUT_CLS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface AgeRestrictionRowProps {
  ageRestriction: AgeRestriction;
  disabled?: boolean;
  onUpdate: (
    updates: Partial<Pick<AgeRestriction, "ageMin" | "ageMax" | "ruleMode">>
  ) => void;
  onRemove: () => void;
}

export function AgeRestrictionRow({
  ageRestriction,
  disabled,
  onUpdate,
  onRemove,
}: AgeRestrictionRowProps) {
  const { t } = useTranslation("admin");
  const { ageMin, ageMax } = ageRestriction;

  const hasAgeMin = ageMin !== null && ageMin !== undefined;
  const hasAgeMax = ageMax !== null && ageMax !== undefined;
  const ageMinInvalid = hasAgeMin && !hasAgeMax;
  const ageMaxInvalid = hasAgeMax && !hasAgeMin;
  const ageRangeInvalid = hasAgeMin && hasAgeMax && ageMax < ageMin;
  const ageFieldsInvalid = ageMinInvalid || ageMaxInvalid || ageRangeInvalid;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-muted/30">
      <div className="flex min-w-[min(100%,18rem)] flex-1 flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-[6px] border border-border">
          <button
            type="button"
            className={`h-9 px-3 text-sm font-medium transition-colors ${
              ageRestriction.ruleMode?.toLocaleLowerCase() === "all"
                ? "bg-brand-red text-white"
                : "bg-background text-foreground hover:bg-muted"
            }`}
            onClick={() => onUpdate({ ruleMode: "all" })}
            disabled={disabled}
          >
            {t("labels.all")}
          </button>
          <button
            type="button"
            className={`h-9 px-3 text-sm font-medium transition-colors ${
              ageRestriction.ruleMode?.toLocaleLowerCase() === "any"
                ? "bg-brand-red text-white"
                : "bg-background text-foreground hover:bg-muted"
            }`}
            onClick={() => onUpdate({ ruleMode: "any" })}
            disabled={disabled}
          >
            {t("labels.any")}
          </button>
        </div>

        <RangeInputGroup
          invalid={ageFieldsInvalid}
          className="max-w-full"
          minLabel={t("labels.minAge")}
          maxLabel={t("labels.maxAge")}
          minInputProps={{
            type: "number",
            min: 0,
            value: ageRestriction.ageMin ?? "",
            onChange: (e) =>
              onUpdate({
                ageMin: parseNonNegativeNumber(e.target.value),
              }),
            disabled,
            placeholder: "-",
            "aria-label": t("labels.minAge"),
          }}
          maxInputProps={{
            type: "number",
            min: 0,
            value: ageRestriction.ageMax ?? "",
            onChange: (e) =>
              onUpdate({
                ageMax: parseNonNegativeNumber(e.target.value),
              }),
            disabled,
            placeholder: "-",
            "aria-label": t("labels.maxAge"),
          }}
          inputClassName={NUM_INPUT_CLS}
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-9 w-9 shrink-0 text-brand-red hover:text-destructive"
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
