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
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ServiceRate } from "@/entities/service-rate";
import {
  useRateRuleResidencies,
  type ConditionOption,
  type ModifierType,
  type RuleComponent,
} from "@/entities/service-option-rate-plan";
import { FormField, fieldDomId, type AnyFormApi } from "@/shared/ui";

import {
  createComponentCondition,
  createComponentDateRow,
} from "../lib/defaults";

import { ComponentConditionsTable } from "./ComponentConditionsTable";
import { ComponentDatesTable } from "./ComponentDatesTable";
import { ComponentResidency } from "./ComponentResidency";

const DEFAULT_COMPONENT_PAX_OPTIONS: ConditionOption[] = [
  "ADT",
  "CHD",
  "INF",
  "YTH",
];
/** Select value for FOC; form stores `rateId: null`. */
const RATE_SELECT_FOC = "__foc__";
const MODIFIER_TYPE_OPTIONS: ModifierType[] = ["%", "Fixed Amount"];

interface ComponentCardProps {
  form: AnyFormApi;
  fieldPrefix: string;
  /** Namespace DOM ids for nested fields (scoped per rate rule) */
  htmlIdPrefix?: string;
  component: RuleComponent;
  rates: ServiceRate[];
  /** Pax codes allowed for this rate rule (from active contract pax types). */
  allowedPaxOptions?: ConditionOption[];
  onDelete: () => void;
  hasPriorityConflict?: boolean;
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

export function ComponentCard({
  form,
  fieldPrefix,
  htmlIdPrefix,
  component,
  rates,
  allowedPaxOptions = DEFAULT_COMPONENT_PAX_OPTIONS,
  onDelete,
  hasPriorityConflict = false,
  actionsLocked = false,
  actionsLockedTitle,
}: ComponentCardProps) {
  const { t } = useTranslation("admin");
  const { data: residencyOptions = [], isLoading: residencyOptionsLoading } =
    useRateRuleResidencies();

  const rateSelectOptions = useMemo(() => {
    const opts = rates.map((r) => ({ id: r.id, name: r.name }));
    if (
      component.rateId != null &&
      !opts.some((o) => o.id === component.rateId)
    ) {
      opts.push({
        id: component.rateId,
        name: t("labels.unknownRate"),
      });
    }
    return opts;
  }, [rates, component.rateId, t]);

  const hasDates = component.componentDates.length > 0;
  const hasConditions = component.componentConditions.length > 0;
  const hasResidency = component.residencies.length > 0;

  const addComponentCondition = () => {
    form.setFieldValue(`${fieldPrefix}.componentConditions`, [
      ...component.componentConditions,
      createComponentCondition(),
    ]);
  };

  const addDates = () => {
    form.setFieldValue(`${fieldPrefix}.componentDates`, [
      createComponentDateRow(),
    ]);
  };

  const addResidency = () => {
    const firstId = residencyOptions[0]?.id;
    if (!firstId) return;
    form.setFieldValue(`${fieldPrefix}.residencies`, [firstId]);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border bg-gray-50 p-4",
        hasPriorityConflict ? "border-destructive bg-red-100" : "border-border"
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            {t("sections.component")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-brand-red hover:text-destructive"
            disabled={actionsLocked}
            title={actionsLocked ? actionsLockedTitle : undefined}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-0.5 text-xs",
              hasConditions
                ? "pointer-events-none opacity-50"
                : "text-brand-red hover:text-brand-red"
            )}
            disabled={actionsLocked || hasConditions}
            title={actionsLocked ? actionsLockedTitle : undefined}
            onClick={addComponentCondition}
          >
            <Plus className="h-3 w-3" />
            {t("buttons.addComponentCondition")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-0.5 text-xs",
              hasDates
                ? "pointer-events-none opacity-50"
                : "text-brand-red hover:text-brand-red"
            )}
            disabled={actionsLocked || hasDates}
            title={actionsLocked ? actionsLockedTitle : undefined}
            onClick={addDates}
          >
            <Plus className="h-3 w-3" />
            {t("buttons.addDates")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-0.5 text-xs",
              hasResidency
                ? "pointer-events-none opacity-50"
                : "text-brand-red hover:text-brand-red"
            )}
            disabled={
              actionsLocked ||
              hasResidency ||
              residencyOptionsLoading ||
              residencyOptions.length === 0
            }
            title={actionsLocked ? actionsLockedTitle : undefined}
            onClick={addResidency}
          >
            <Plus className="h-3 w-3" />
            {t("buttons.addResidency")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Fields Table */}
        <div className="overflow-x-auto rounded-[6px] border border-border">
          <Table className="w-full min-w-[44rem] table-fixed rounded-4">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 w-[15%] bg-gray-300 pl-4 pr-2 text-sm font-semibold text-foreground">
                  {t("labels.priority")}
                </TableHead>
                <TableHead className="h-9 w-[20%] border-l border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-foreground">
                  {t("labels.paxType")}
                </TableHead>
                <TableHead className="h-9 w-[25%] border-l border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-foreground">
                  {t("labels.rate")}
                  <span className="text-[#f54a00]">*</span>
                </TableHead>
                <TableHead className="h-9 w-[20%] border-l border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-foreground">
                  {t("labels.modifier")}
                </TableHead>
                <TableHead className="h-9 w-[20%] border-l border-border bg-gray-300 pl-4 pr-2 text-sm font-semibold text-foreground">
                  {t("labels.type")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-white hover:bg-transparent">
                <TableCell className="p-0">
                  <FormField
                    form={form}
                    name={`${fieldPrefix}.priority`}
                    htmlIdPrefix={htmlIdPrefix}
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Input
                        type="number"
                        squareFocus
                        className={cn(
                          "h-9 w-full rounded-none border-none bg-white pl-4 pr-2 text-sm shadow-none hover:bg-gray-50 focus:border focus:border-brand-red focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-brand-red! focus-visible:ring-offset-0! [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                          hasPriorityConflict && "border-destructive!"
                        )}
                        value={field.state.value as number}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          field.handleChange(Number.isNaN(v) ? 0 : v);
                        }}
                        onBlur={field.handleBlur}
                      />
                    )}
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <FormField
                    form={form}
                    name={`${fieldPrefix}.paxType`}
                    htmlIdPrefix={htmlIdPrefix}
                    suppressDomId
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Select
                        value={(field.state.value as string) ?? ""}
                        onValueChange={(v) =>
                          field.handleChange((v as ConditionOption) || null)
                        }
                      >
                        <SelectTrigger
                          id={fieldDomId(
                            htmlIdPrefix,
                            `${fieldPrefix}.paxType`
                          )}
                          useFilledCaretIcon
                          className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 text-sm shadow-none [--select-radius:0px] [--select-focus-radius:0px] hover:bg-gray-50 focus-visible:rounded-none!"
                        >
                          <SelectValue placeholder={t("labels.select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedPaxOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
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
                    name={`${fieldPrefix}.rateId`}
                    htmlIdPrefix={htmlIdPrefix}
                    suppressDomId
                    hideError
                    className="w-full"
                  >
                    {(field) => {
                      const v = field.state.value as string | null;
                      const selectValue =
                        v === null ? RATE_SELECT_FOC : (v ?? "");
                      return (
                        <Select
                          value={selectValue}
                          onValueChange={(next) => {
                            if (next === RATE_SELECT_FOC) {
                              field.handleChange(null);
                            } else {
                              field.handleChange(next);
                            }
                          }}
                        >
                          <SelectTrigger
                            id={fieldDomId(
                              htmlIdPrefix,
                              `${fieldPrefix}.rateId`
                            )}
                            useFilledCaretIcon
                            className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 text-sm shadow-none [--select-radius:0px] [--select-focus-radius:0px] hover:bg-gray-50 focus-visible:rounded-none!"
                          >
                            <SelectValue placeholder={t("labels.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RATE_SELECT_FOC}>
                              {t("labels.freeOfCharge")}
                            </SelectItem>
                            {rateSelectOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <FormField
                    form={form}
                    name={`${fieldPrefix}.modifier`}
                    htmlIdPrefix={htmlIdPrefix}
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Input
                        type="number"
                        squareFocus
                        className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 text-sm shadow-none hover:bg-gray-50 focus:border focus:border-brand-red focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-brand-red! focus-visible:ring-offset-0! [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={(field.state.value as number | null) ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          field.handleChange(Number.isNaN(v) ? null : v);
                        }}
                        onBlur={field.handleBlur}
                      />
                    )}
                  </FormField>
                </TableCell>
                <TableCell className="border-l border-border p-0">
                  <FormField
                    form={form}
                    name={`${fieldPrefix}.type`}
                    htmlIdPrefix={htmlIdPrefix}
                    suppressDomId
                    hideError
                    className="w-full"
                  >
                    {(field) => (
                      <Select
                        value={field.state.value as string}
                        onValueChange={(v) =>
                          field.handleChange(v as ModifierType)
                        }
                      >
                        <SelectTrigger
                          id={fieldDomId(htmlIdPrefix, `${fieldPrefix}.type`)}
                          useFilledCaretIcon
                          className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 text-sm shadow-none [--select-radius:0px] [--select-focus-radius:0px] hover:bg-gray-50 focus-visible:rounded-none!"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODIFIER_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Optional: Component Conditions */}
        {hasConditions && (
          <ComponentConditionsTable
            form={form}
            fieldPrefix={`${fieldPrefix}.componentConditions`}
            htmlIdPrefix={htmlIdPrefix}
            conditions={component.componentConditions}
            actionsLocked={actionsLocked}
            actionsLockedTitle={actionsLockedTitle}
          />
        )}

        {/* Optional: Component Dates */}
        {hasDates && (
          <ComponentDatesTable
            form={form}
            componentFieldPrefix={fieldPrefix}
            dates={component.componentDates}
            bookingWindowFrom={component.bookingWindowFrom}
            bookingWindowTo={component.bookingWindowTo}
            bookingWindowFromDays={component.bookingWindowFromDays}
            bookingWindowToDays={component.bookingWindowToDays}
            actionsLocked={actionsLocked}
            actionsLockedTitle={actionsLockedTitle}
          />
        )}

        {/* Optional: Residency */}
        {hasResidency && (
          <ComponentResidency
            form={form}
            fieldPrefix={`${fieldPrefix}.residencies`}
            residencyOptions={residencyOptions}
            residencies={component.residencies}
            onDelete={() =>
              form.setFieldValue(`${fieldPrefix}.residencies`, [])
            }
            actionsLocked={actionsLocked}
            actionsLockedTitle={actionsLockedTitle}
          />
        )}
      </div>
    </div>
  );
}
