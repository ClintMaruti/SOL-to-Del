import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ConditionOption,
  ConditionType,
  RuleCondition,
} from "@/entities/service-option-rate-plan";
import { FormField, fieldDomId, type AnyFormApi } from "@/shared/ui";

const CONDITION_TYPE_OPTIONS: Array<{ value: ConditionType; label: string }> = [
  { value: "Pax", label: "PAX" },
  { value: "Nights", label: "Nights" },
  { value: "Unit", label: "Units" },
  { value: "TotalPax", label: "Total Pax" },
];

const OPTION_MAP: Record<ConditionType, Array<ConditionOption | "Number">> = {
  Pax: ["ADT", "CHD", "INF", "YTH"],
  Nights: ["Number"],
  Unit: ["Number"],
  TotalPax: ["Number"],
};

/** Overrides @sol/ui Input tokens so cells stay white (empty, filled, readonly, hover, focus). */
const CONDITIONS_TABLE_INPUT_BG =
  "bg-white! data-[filled=true]:bg-white! data-[readonly=true]:bg-white! hover:bg-white! focus:bg-white! focus-visible:bg-white! aria-invalid:bg-white! aria-invalid:data-[filled=true]:bg-white!";

const CONDITIONS_TABLE_NUMBER_INPUT_CLASSNAME = `${CONDITIONS_TABLE_INPUT_BG} h-9 w-full rounded-none border-none pl-4 pr-2 text-sm shadow-none focus:border focus:border-brand-red focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-brand-red! focus-visible:ring-offset-0! [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

const CONDITIONS_TABLE_HEADER =
  "h-9 bg-gray-300 text-sm font-semibold text-neutral-900";
const CONDITIONS_TABLE_HEADER_LEFT = `${CONDITIONS_TABLE_HEADER} pl-4 pr-2 text-left`;
const CONDITIONS_TABLE_HEADER_ACTION = `${CONDITIONS_TABLE_HEADER} border-l border-border pl-4 pr-2 text-right`;

interface ConditionsTableProps {
  form: AnyFormApi;
  fieldPrefix: string;
  /** Namespace DOM ids when several rate-rule forms share field paths on one page */
  htmlIdPrefix?: string;
  conditions: RuleCondition[];
  allowedPaxOptions?: ConditionOption[];
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

export function ConditionsTable({
  form,
  fieldPrefix,
  htmlIdPrefix,
  conditions,
  allowedPaxOptions = ["ADT", "CHD", "INF", "YTH"],
  actionsLocked = false,
  actionsLockedTitle,
}: ConditionsTableProps) {
  const { t } = useTranslation("admin");

  const removeRow = (index: number) => {
    form.setFieldValue(
      fieldPrefix,
      conditions.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="overflow-x-auto rounded-[6px] border border-border">
      <Table className="w-full min-w-[38rem] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn("w-[25%]", CONDITIONS_TABLE_HEADER_LEFT)}>
              {t("labels.condition")}
            </TableHead>
            <TableHead className={cn("w-[25%]", CONDITIONS_TABLE_HEADER_LEFT)}>
              {t("labels.option")}
            </TableHead>
            <TableHead className={cn("w-[20%]", CONDITIONS_TABLE_HEADER_LEFT)}>
              {t("labels.min")}
            </TableHead>
            <TableHead className={cn("w-[20%]", CONDITIONS_TABLE_HEADER_LEFT)}>
              {t("labels.max")}
            </TableHead>
            <TableHead
              className={cn("w-[10%]", CONDITIONS_TABLE_HEADER_ACTION)}
            >
              {t("labels.action")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conditions.map((cond, i) => {
            const rowPrefix = `${fieldPrefix}[${i}]`;
            const conditionFieldName = `${rowPrefix}.condition`;
            const optionFieldName = `${rowPrefix}.option`;
            const options =
              cond.condition === "Pax"
                ? allowedPaxOptions
                : (OPTION_MAP[cond.condition] ?? []);
            const isNumberOnlyOption =
              options.length === 1 && options[0] === "Number";
            return (
              <TableRow
                key={cond.id}
                className="border-b border-border bg-white last:border-b-0 hover:bg-transparent"
              >
                <TableCell className="p-0">
                  <FormField
                    form={form}
                    name={conditionFieldName}
                    htmlIdPrefix={htmlIdPrefix}
                    suppressDomId
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Select
                        value={field.state.value as string}
                        onValueChange={(v) => {
                          const nextCondition = v as ConditionType;
                          field.handleChange(nextCondition);
                          const nextOptions = OPTION_MAP[nextCondition] ?? [];
                          const effectiveOptions =
                            nextCondition === "Pax"
                              ? allowedPaxOptions
                              : nextOptions;
                          const nextOption =
                            effectiveOptions.length === 1 &&
                            effectiveOptions[0] === "Number"
                              ? "Number"
                              : nextCondition === "Pax"
                                ? (effectiveOptions[0] ?? null)
                                : null;
                          form.setFieldValue(`${rowPrefix}.option`, nextOption);
                        }}
                      >
                        <SelectTrigger
                          id={fieldDomId(htmlIdPrefix, conditionFieldName)}
                          useFilledCaretIcon
                          className="[&>svg]:text-black [&>svg]:opacity-100 h-9 w-full rounded-none border-none bg-white! pl-4 pr-2 text-sm shadow-none [--select-radius:0px] [--select-focus-radius:0px] not-data-placeholder:bg-white! data-[filled=true]:bg-white! hover:bg-white! focus-visible:rounded-none! focus-visible:bg-white!"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_TYPE_OPTIONS.map((ct) => (
                            <SelectItem key={ct.value} value={ct.value}>
                              {ct.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <FormField
                    form={form}
                    name={optionFieldName}
                    htmlIdPrefix={htmlIdPrefix}
                    suppressDomId={!isNumberOnlyOption}
                    hideError
                    className="w-full"
                  >
                    {(field) =>
                      isNumberOnlyOption ? (
                        <Input
                          squareFocus
                          readOnly
                          value="Number"
                          className={`${CONDITIONS_TABLE_INPUT_BG} h-9 w-full rounded-none border-none pl-4 pr-2 text-sm shadow-none focus-visible:ring-0`}
                        />
                      ) : (
                        <Select
                          value={(field.state.value as string) ?? ""}
                          onValueChange={(v) => field.handleChange(v || null)}
                        >
                          <SelectTrigger
                            id={fieldDomId(htmlIdPrefix, optionFieldName)}
                            useFilledCaretIcon
                            className="[&>svg]:text-black [&>svg]:opacity-100 h-9 w-full rounded-none border-none bg-white! pl-4 pr-2 text-sm shadow-none [--select-radius:0px] [--select-focus-radius:0px] not-data-placeholder:bg-white! data-[filled=true]:bg-white! hover:bg-white! focus-visible:rounded-none! focus-visible:bg-white!"
                          >
                            <SelectValue placeholder={t("labels.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    }
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <FormField
                    form={form}
                    name={`${rowPrefix}.min`}
                    htmlIdPrefix={htmlIdPrefix}
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Input
                        type="number"
                        squareFocus
                        className={CONDITIONS_TABLE_NUMBER_INPUT_CLASSNAME}
                        value={(field.state.value as number | null) ?? ""}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          field.handleChange(
                            e.target.value === "" || Number.isNaN(n) ? null : n
                          );
                        }}
                        onBlur={field.handleBlur}
                      />
                    )}
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <FormField
                    form={form}
                    name={`${rowPrefix}.max`}
                    htmlIdPrefix={htmlIdPrefix}
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Input
                        type="number"
                        squareFocus
                        className={CONDITIONS_TABLE_NUMBER_INPUT_CLASSNAME}
                        value={(field.state.value as number | null) ?? ""}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          field.handleChange(
                            e.target.value === "" || Number.isNaN(n) ? null : n
                          );
                        }}
                        onBlur={field.handleBlur}
                      />
                    )}
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <div className="flex h-9 items-center justify-end pl-4 pr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-brand-red hover:text-destructive"
                      disabled={actionsLocked}
                      title={actionsLocked ? actionsLockedTitle : undefined}
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
