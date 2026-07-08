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
import { useStore } from "@tanstack/react-form";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  PROMOTION_CONDITION_TYPES,
  PROMOTION_PAX_CODES,
  PROMOTION_SELECT_ANY_VALUE,
  type PromotionFormCondition,
} from "@/entities/promotion";
import {
  useSupplierServices,
  type SupplierService,
} from "@/entities/supplier-services";
import type { Supplier } from "@/entities/suppliers";
import { FormField, type AnyFormApi } from "@/shared/ui";

import { changePromotionConditionType } from "../lib/promotionConditionType.utils";
import {
  getConditionOptionValues,
  getSelectableSupplierServices,
  getSupplierServiceLabel,
  parseNullableInteger,
} from "../lib/promotionRules.utils";

interface PromotionConditionRowProps {
  form: AnyFormApi;
  condition: PromotionFormCondition;
  index: number;
  suppliers: Supplier[];
  canRemove: boolean;
  onRemove: () => void;
}

function getMinFieldName(condition: PromotionFormCondition, index: number) {
  if (condition.type === "SupplierNights" || condition.type === "NightsTotal") {
    return `conditions[${index}].minNights`;
  }

  if (condition.type === "SuppliersTotal") {
    return `conditions[${index}].minSuppliers`;
  }

  if (condition.type === "PaxNumber") {
    return `conditions[${index}].minPax`;
  }

  return `conditions[${index}].minAge`;
}

function getMaxFieldName(condition: PromotionFormCondition, index: number) {
  if (condition.type === "SupplierNights" || condition.type === "NightsTotal") {
    return `conditions[${index}].maxNights`;
  }

  if (condition.type === "SuppliersTotal") {
    return `conditions[${index}].maxSuppliers`;
  }

  if (condition.type === "PaxNumber") {
    return `conditions[${index}].maxPax`;
  }

  return `conditions[${index}].maxAge`;
}

function renderStaticCell(content: string) {
  return (
    <div className="flex h-9 items-center bg-white px-4 text-sm font-medium text-text-primary">
      {content}
    </div>
  );
}

function renderMergedEmptyTableCell(colSpan: number) {
  return (
    <TableCell
      colSpan={colSpan}
      className="border-r border-border-tertiary bg-white p-0 align-top"
    >
      {renderStaticCell("")}
    </TableCell>
  );
}

function renderSupplierOrPaxCell({
  form,
  condition,
  index,
  suppliers,
  t,
}: {
  form: AnyFormApi;
  condition: PromotionFormCondition;
  index: number;
  suppliers: Supplier[];
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  if (condition.type === "SupplierNights") {
    return (
      <FormField form={form} name={`conditions[${index}].supplierId`} hideError>
        {(field) => (
          <Select
            value={(field.state.value as string | null) ?? ""}
            onValueChange={(value) => {
              field.handleChange(value || null);
              form.setFieldValue(`conditions[${index}].serviceId`, null);
              form.setFieldValue(`conditions[${index}].optionText`, "");
            }}
          >
            <SelectTrigger
              useFilledCaretIcon
              className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none focus-visible:rounded-none"
            >
              <SelectValue
                placeholder={t("admin:placeholders.selectSupplier")}
              />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
    );
  }

  if (condition.type === "PaxNumber" || condition.type === "PaxAge") {
    return (
      <FormField form={form} name={`conditions[${index}].paxCode`} hideError>
        {(field) => (
          <Select
            value={(field.state.value as string) ?? "ANY"}
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
    );
  }

  return renderStaticCell("");
}

function renderServiceCell({
  form,
  condition,
  index,
  supplierId,
  selectableSupplierServices,
  t,
}: {
  form: AnyFormApi;
  condition: PromotionFormCondition;
  index: number;
  supplierId: string | null;
  selectableSupplierServices: SupplierService[];
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  if (condition.type !== "SupplierNights") {
    return renderStaticCell("");
  }

  return (
    <FormField form={form} name={`conditions[${index}].serviceId`} hideError>
      {(field) => (
        <Select
          value={(field.state.value as string | null) ?? ""}
          onValueChange={(value) => {
            field.handleChange(value || null);
            form.setFieldValue(`conditions[${index}].optionText`, "");
          }}
          disabled={!supplierId}
        >
          <SelectTrigger
            useFilledCaretIcon
            className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none data-[placeholder]:text-text-secondary focus-visible:rounded-none"
          >
            <SelectValue placeholder={t("admin:placeholders.selectService")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PROMOTION_SELECT_ANY_VALUE}>
              {t("admin:labels.any").toUpperCase()}
            </SelectItem>
            {selectableSupplierServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {getSupplierServiceLabel(service)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}

function renderOptionValueCell({
  form,
  condition,
  index,
  supplierId,
  optionValues,
  t,
}: {
  form: AnyFormApi;
  condition: PromotionFormCondition;
  index: number;
  supplierId: string | null;
  optionValues: string[];
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  if (condition.type !== "SupplierNights") {
    return renderStaticCell("");
  }

  return (
    <FormField form={form} name={`conditions[${index}].optionText`} hideError>
      {(field) => (
        <Select
          value={(field.state.value as string) || ""}
          onValueChange={(value) => field.handleChange(value)}
          disabled={!supplierId}
        >
          <SelectTrigger
            useFilledCaretIcon
            className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none data-[placeholder]:text-text-secondary focus-visible:rounded-none"
          >
            <SelectValue placeholder={t("admin:placeholders.selectOption")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PROMOTION_SELECT_ANY_VALUE}>
              {t("admin:labels.any").toUpperCase()}
            </SelectItem>
            {optionValues.map((optionValue) => (
              <SelectItem key={optionValue} value={optionValue}>
                {optionValue}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}

function renderNumericCell({
  form,
  fieldName,
}: {
  form: AnyFormApi;
  fieldName: string;
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
          className="h-9 rounded-none border-none bg-white pl-4 pr-2 text-right shadow-none focus-visible:rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      )}
    </FormField>
  );
}

export function PromotionConditionRow({
  form,
  condition,
  index,
  suppliers,
  canRemove,
  onRemove,
}: PromotionConditionRowProps) {
  const { t } = useTranslation(["admin", "common"]);
  const conditionValues = useStore(form.store, (state) => {
    return (state as { values: { conditions: PromotionFormCondition[] } })
      .values.conditions;
  });
  const supplierId =
    condition.type === "SupplierNights" ? condition.supplierId : null;
  const { data: supplierServices = [] } = useSupplierServices(supplierId);
  const selectableSupplierServices =
    getSelectableSupplierServices(supplierServices);
  const selectedServiceId =
    condition.type === "SupplierNights" ? condition.serviceId : null;
  const optionValues = getConditionOptionValues(
    selectableSupplierServices,
    selectedServiceId
  );

  const replaceConditionType = (nextType: PromotionFormCondition["type"]) => {
    form.setFieldValue(
      "conditions",
      conditionValues.map((currentCondition, currentIndex) => {
        if (currentIndex !== index) return currentCondition;
        return changePromotionConditionType(currentCondition, nextType);
      })
    );
  };

  return (
    <TableRow className="bg-white hover:bg-transparent">
      <TableCell className="border-r border-border-tertiary p-0 align-top">
        <FormField form={form} name={`conditions[${index}].type`} hideError>
          {(field) => (
            <Select
              value={field.state.value as string}
              onValueChange={(value) => {
                replaceConditionType(value as PromotionFormCondition["type"]);
              }}
            >
              <SelectTrigger
                useFilledCaretIcon
                className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMOTION_CONDITION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`admin:promotion.conditionTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </TableCell>
      {condition.type === "SupplierNights" ? (
        <>
          <TableCell className="border-r border-border-tertiary p-0 align-top">
            {renderSupplierOrPaxCell({
              form,
              condition,
              index,
              suppliers,
              t,
            })}
          </TableCell>
          <TableCell className="border-r border-border-tertiary p-0 align-top">
            {renderServiceCell({
              form,
              condition,
              index,
              supplierId,
              selectableSupplierServices,
              t,
            })}
          </TableCell>
          <TableCell className="border-r border-border-tertiary p-0 align-top">
            {renderOptionValueCell({
              form,
              condition,
              index,
              supplierId,
              optionValues,
              t,
            })}
          </TableCell>
        </>
      ) : (
        <>
          {(condition.type === "PaxNumber" || condition.type === "PaxAge") && (
            <TableCell className="border-r border-border-tertiary p-0 align-top">
              {renderSupplierOrPaxCell({
                form,
                condition,
                index,
                suppliers,
                t,
              })}
            </TableCell>
          )}
          {renderMergedEmptyTableCell(
            condition.type === "PaxNumber" || condition.type === "PaxAge"
              ? 2
              : 3
          )}
        </>
      )}
      <TableCell className="border-r border-border-tertiary p-0 align-top">
        {renderNumericCell({
          form,
          fieldName: getMinFieldName(condition, index),
        })}
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0 align-top">
        {renderNumericCell({
          form,
          fieldName: getMaxFieldName(condition, index),
        })}
      </TableCell>
      <TableCell className="p-0 pr-2 text-right align-top">
        <Button
          type="button"
          variant="ghost"
          size="icon-md"
          className="text-brand-red hover:text-destructive"
          onClick={onRemove}
          disabled={!canRemove || conditionValues.length <= 1}
          aria-label={t("admin:buttons.remove")}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
