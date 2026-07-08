import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  PROMOTION_PAX_CODES,
  type PromotionFormDiscountRow,
  type PromotionTargetNightsType,
} from "@/entities/promotion";
import { FormField, type AnyFormApi } from "@/shared/ui";

import { parseNullableInteger } from "../lib/promotionRules.utils";

interface PromotionDiscountRowProps {
  form: AnyFormApi;
  actionIndex: number;
  row: PromotionFormDiscountRow;
  rowIndex: number;
  onRemove: () => void;
  canRemove: boolean;
}

const VISIBLE_PROMOTION_TARGET_NIGHTS_TYPES: readonly PromotionTargetNightsType[] =
  [
    "ANY",
    "Cheapest",
    // "Average",
    "AnyFromFirst",
    "AnyFromLast",
    // "ByIndex",
  ];

function renderNumericCell({
  form,
  fieldName,
  alignRight = false,
}: {
  form: AnyFormApi;
  fieldName: string;
  alignRight?: boolean;
}) {
  return (
    <FormField form={form} name={fieldName} hideError>
      {(field) => (
        <Input
          type="number"
          inputMode="numeric"
          value={(field.state.value as number | null) ?? ""}
          onChange={(e) =>
            field.handleChange(parseNullableInteger(e.target.value))
          }
          className={`h-9 rounded-none border-none bg-white pl-4 pr-2 shadow-none focus-visible:rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none${alignRight ? " text-right" : ""}`}
        />
      )}
    </FormField>
  );
}

export function PromotionDiscountRow({
  form,
  actionIndex,
  row,
  rowIndex,
  onRemove,
  canRemove,
}: PromotionDiscountRowProps) {
  const { t } = useTranslation(["admin", "common"]);
  const targetNightsTypeOptions =
    VISIBLE_PROMOTION_TARGET_NIGHTS_TYPES.includes(row.targetNightsType)
      ? VISIBLE_PROMOTION_TARGET_NIGHTS_TYPES
      : [...VISIBLE_PROMOTION_TARGET_NIGHTS_TYPES, row.targetNightsType];

  return (
    <TableRow className="bg-white hover:bg-transparent">
      <TableCell className="border-r border-border-tertiary p-0">
        {renderNumericCell({
          form,
          fieldName: `actions[${actionIndex}].rows[${rowIndex}].discountPercent`,
        })}
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0">
        <FormField
          form={form}
          name={`actions[${actionIndex}].rows[${rowIndex}].paxCode`}
          hideError
        >
          {(field) => (
            <Select
              value={(field.state.value as string) ?? row.paxCode}
              onValueChange={(value) => field.handleChange(value)}
            >
              <SelectTrigger
                useFilledCaretIcon
                className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none focus-visible:rounded-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMOTION_PAX_CODES.map((paxCode) => (
                  <SelectItem key={paxCode} value={paxCode}>
                    {paxCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0">
        {renderNumericCell({
          form,
          fieldName: `actions[${actionIndex}].rows[${rowIndex}].paxIndexFrom`,
          alignRight: true,
        })}
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0">
        {renderNumericCell({
          form,
          fieldName: `actions[${actionIndex}].rows[${rowIndex}].paxIndexTo`,
          alignRight: true,
        })}
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0">
        <FormField
          form={form}
          name={`actions[${actionIndex}].rows[${rowIndex}].targetNightsType`}
          hideError
        >
          {(field) => (
            <Select
              value={(field.state.value as string) ?? row.targetNightsType}
              onValueChange={(value) => field.handleChange(value)}
            >
              <SelectTrigger
                useFilledCaretIcon
                className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none focus-visible:rounded-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetNightsTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`admin:promotion.targetNightsTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0">
        {renderNumericCell({
          form,
          fieldName: `actions[${actionIndex}].rows[${rowIndex}].nightIndexFrom`,
          alignRight: true,
        })}
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0">
        {renderNumericCell({
          form,
          fieldName: `actions[${actionIndex}].rows[${rowIndex}].nightIndexTo`,
          alignRight: true,
        })}
      </TableCell>
      <TableCell className="p-0 pr-2 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon-md"
          className="text-brand-red hover:text-destructive"
          aria-label={t("admin:buttons.remove")}
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
