import {
  Button,
  RangeInputGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PaxTypeConstraint } from "@/entities/service-eligibility";

import { parseNonNegativeNumber } from "../model/parseNonNegativeNumber";

const PAX_TYPE_OPTIONS = ["ADT", "CHD", "INF"];

const NUM_INPUT_CLS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface PaxTypeConstraintFieldProps {
  constraint: PaxTypeConstraint;
  saveAttempted?: boolean;
  hasAgeRestriction: boolean;
  disabled?: boolean;
  onUpdate: (
    updates: Partial<
      Pick<PaxTypeConstraint, "paxType" | "paxCode" | "minCount" | "maxCount">
    >
  ) => void;
  onSpecifyAge: () => void;
}

export function PaxTypeConstraintField({
  constraint,
  saveAttempted,
  hasAgeRestriction,
  disabled,
  onUpdate,
  onSpecifyAge,
}: PaxTypeConstraintFieldProps) {
  const { t } = useTranslation("admin");

  const hasMin = constraint.minCount !== null;
  const hasMax = constraint.maxCount !== null;
  const boundsIncomplete = hasMin !== hasMax;
  const minInvalid =
    (saveAttempted && constraint.minCount === null) || boundsIncomplete;
  const maxInvalid =
    (saveAttempted && constraint.maxCount === null) || boundsIncomplete;
  const rangeInvalid =
    hasMin && hasMax && constraint.maxCount! < constraint.minCount!;
  const fieldsInvalid = minInvalid || maxInvalid || rangeInvalid;

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-[min(100%,18rem)] flex-1 flex-wrap items-start gap-2">
        <Select
          value={constraint.paxCode}
          onValueChange={(v) => onUpdate({ paxCode: v })}
          disabled={disabled}
        >
          <SelectTrigger className="w-24 rounded-[6px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAX_TYPE_OPTIONS.map((pt) => (
              <SelectItem key={pt} value={pt}>
                {pt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <RangeInputGroup
          invalid={fieldsInvalid}
          className="max-w-full"
          minLabel={t("labels.min").toLowerCase()}
          maxLabel={t("labels.max").toLowerCase()}
          minInputProps={{
            type: "number",
            min: 0,
            value: constraint.minCount ?? "",
            onChange: (e) =>
              onUpdate({
                minCount: parseNonNegativeNumber(e.target.value),
              }),
            disabled,
            placeholder: "-",
            "aria-label": `${t("labels.min")} ${constraint.paxType}`,
          }}
          maxInputProps={{
            type: "number",
            min: 0,
            value: constraint.maxCount ?? "",
            onChange: (e) =>
              onUpdate({
                maxCount: parseNonNegativeNumber(e.target.value),
              }),
            disabled,
            placeholder: "-",
            "aria-label": `${t("labels.max")} ${constraint.paxType}`,
          }}
          inputClassName={NUM_INPUT_CLS}
        />
      </div>

      <Button
        variant="outline-secondary"
        size="sm"
        onClick={onSpecifyAge}
        disabled={hasAgeRestriction || disabled}
        className="shrink-0 text-sm font-medium text-neutral-600 disabled:opacity-50"
      >
        <Plus className="mr-1 h-4 w-4" />
        {t("buttons.specifyAge")}
      </Button>
    </div>
  );
}
