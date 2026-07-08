import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { Info, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  PromotionFormAction,
  PromotionFormCondition,
} from "@/entities/promotion";
import { useServiceTypes } from "@/entities/service-type";
import type { Supplier } from "@/entities/suppliers";
import {
  createPromotionAddOnActionFormValue,
  createPromotionAddOnItemFormValue,
  createPromotionConditionFormValue,
  createPromotionDiscountActionFormValue,
  createPromotionDiscountRowFormValue,
} from "@/features/create-promotion";
import { FormMessage, type AnyFormApi } from "@/shared/ui";

import { usePromotionFieldErrorsByPrefix } from "../lib/usePromotionFieldErrors";
import { PromotionAddOnRow } from "./PromotionAddOnRow";
import { PromotionConditionRow } from "./PromotionConditionRow";
import { PromotionDiscountRow } from "./PromotionDiscountRow";
import { PromotionRulesSectionLabel } from "./PromotionRulesSectionLabel";
import { PromotionRulesTextActionButton } from "./PromotionRulesTextActionButton";

interface PromotionRulesCardProps {
  form: AnyFormApi;
  suppliers: Supplier[];
}

// Derived from Figma. The conditions table width is 1186px,
// and the original column widths are 180 / 351 / 200 / 200 / 85 / 85 / 85.
// We store the final percentages directly so the layout stays stable without
// recalculating them during render.
const PROMOTION_CONDITIONS_COLUMN_WIDTHS = [
  "15.1771%",
  "29.5953%",
  "16.8634%",
  "16.8634%",
  "7.1669%",
  "7.1669%",
  "7.1669%",
] as const;

// Derived from Figma. The discount actions table width is
// 1186px, and the original column widths are
// 150 / 306 / 85 / 85 / 306 / 85 / 85 / 84.
const PROMOTION_DISCOUNT_COLUMN_WIDTHS = [
  "12.6476%",
  "25.8010%",
  "7.1669%",
  "7.1669%",
  "25.8010%",
  "7.1669%",
  "7.1669%",
  "7.0826%",
] as const;

export function PromotionRulesCard({
  form,
  suppliers,
}: PromotionRulesCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { data: serviceTypes = [] } = useServiceTypes();
  const values = useStore(form.store, (state) => {
    return (
      state as {
        values: {
          conditions: PromotionFormCondition[];
          actions: PromotionFormAction[];
        };
      }
    ).values;
  });

  const conditionsError = usePromotionFieldErrorsByPrefix(form, "conditions");
  const actionsError = usePromotionFieldErrorsByPrefix(form, "actions");
  const rulesErrors = [...new Set([...conditionsError, ...actionsError])];

  const addCondition = () => {
    form.setFieldValue("conditions", [
      ...values.conditions,
      createPromotionConditionFormValue("SupplierNights"),
    ]);
  };

  const removeCondition = (index: number) => {
    if (values.conditions.length <= 1) {
      form.setFieldValue("conditions", [
        createPromotionConditionFormValue("SupplierNights"),
      ]);
      return;
    }

    form.setFieldValue(
      "conditions",
      values.conditions.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const discountActionIndex = values.actions.findIndex(
    (action) => action.type === "DiscountPercentage"
  );
  const addOnActionIndex = values.actions.findIndex(
    (action) => action.type === "AddOn"
  );

  const discountAction =
    discountActionIndex >= 0 &&
    values.actions[discountActionIndex]?.type === "DiscountPercentage"
      ? values.actions[discountActionIndex]
      : null;
  const addOnAction =
    addOnActionIndex >= 0 && values.actions[addOnActionIndex]?.type === "AddOn"
      ? values.actions[addOnActionIndex]
      : null;

  const addAction = (type: PromotionFormAction["type"]) => {
    if (type === "DiscountPercentage" && discountAction) {
      form.setFieldValue(`actions[${discountActionIndex}].rows`, [
        ...discountAction.rows,
        createPromotionDiscountRowFormValue(),
      ]);
      return;
    }

    if (type === "AddOn" && addOnAction) {
      form.setFieldValue(`actions[${addOnActionIndex}].items`, [
        ...addOnAction.items,
        createPromotionAddOnItemFormValue(),
      ]);
      return;
    }

    form.setFieldValue("actions", [
      ...values.actions,
      type === "DiscountPercentage"
        ? createPromotionDiscountActionFormValue()
        : createPromotionAddOnActionFormValue(),
    ]);
  };

  const removeAction = (type: PromotionFormAction["type"]) => {
    form.setFieldValue(
      "actions",
      values.actions.filter((action) => action.type !== type)
    );
  };

  return (
    <Card
      id="promotion-rules"
      className="rounded-[6px] border-border-tertiary bg-white shadow-none"
    >
      <CardContent className="space-y-4 p-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <PromotionRulesSectionLabel
              suffix={
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex cursor-help text-text-info-bold"
                      aria-label={t("tooltips.promotionConditionsInfoTitle")}
                    >
                      <Info className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="max-w-[490px] border-transparent bg-background-inverse px-3 py-4 text-text-primary-inverse shadow-none"
                    arrowClassName="fill-background-inverse"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold leading-6 text-text-primary-inverse">
                        {t("tooltips.promotionConditionsInfoTitle")}
                      </p>
                      <p className="text-sm font-medium leading-6 text-text-secondary-inverse">
                        {t("tooltips.promotionConditionsInfoDescription")}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              }
            >
              {t("sections.conditions")}
            </PromotionRulesSectionLabel>

            <PromotionRulesTextActionButton onClick={addCondition}>
              <Plus className="size-4" />
              {t("buttons.addCondition")}
            </PromotionRulesTextActionButton>
          </div>

          <div className="overflow-hidden rounded-[6px] border border-border-tertiary">
            <Table className="table-fixed w-full">
              <colgroup>
                {PROMOTION_CONDITIONS_COLUMN_WIDTHS.map((width, index) => (
                  <col key={index} style={{ width }} />
                ))}
              </colgroup>
              <TableHeader>
                <TableRow className="bg-background-disabled hover:bg-background-disabled">
                  <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary">
                    {t("sections.conditions")}
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary"
                  >
                    {t("labels.option")}
                  </TableHead>
                  <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                    {t("labels.min")}
                  </TableHead>
                  <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                    {t("labels.max")}
                  </TableHead>
                  <TableHead className="h-9 bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                    {t("table.action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {values.conditions.map((condition, index) => (
                  <PromotionConditionRow
                    key={condition.id}
                    form={form}
                    condition={condition}
                    index={index}
                    suppliers={suppliers}
                    canRemove={values.conditions.length > 1}
                    onRemove={() => removeCondition(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <PromotionRulesSectionLabel>
              {t("sections.actions")}
            </PromotionRulesSectionLabel>

            <div className="flex flex-wrap items-center gap-2">
              <PromotionRulesTextActionButton
                onClick={() => addAction("DiscountPercentage")}
              >
                <Plus className="size-4" />
                {t("buttons.addDiscount")}
              </PromotionRulesTextActionButton>
              <PromotionRulesTextActionButton
                onClick={() => addAction("AddOn")}
              >
                <Plus className="size-4" />
                {t("buttons.addAddOn")}
              </PromotionRulesTextActionButton>
            </div>
          </div>

          {discountAction ? (
            <div className="overflow-hidden rounded-[6px] border border-border-tertiary bg-white">
              <Table className="table-fixed w-full">
                <colgroup>
                  {PROMOTION_DISCOUNT_COLUMN_WIDTHS.map((width, index) => (
                    <col key={index} style={{ width }} />
                  ))}
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-background-disabled hover:bg-background-disabled">
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary">
                      {t("labels.discountPercent")}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary">
                      {t("labels.pax")}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                      {`# ${t("labels.from")}`}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                      {`# ${t("labels.to")}`}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary">
                      {t("labels.nights")}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                      {`# ${t("labels.from")}`}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                      {`# ${t("labels.to")}`}
                    </TableHead>
                    <TableHead className="h-9 bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                      {t("table.action")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountAction.rows.map((row, rowIndex) => (
                    <PromotionDiscountRow
                      key={row.id}
                      form={form}
                      actionIndex={discountActionIndex}
                      row={row}
                      rowIndex={rowIndex}
                      canRemove={true}
                      onRemove={() => {
                        if (discountAction.rows.length <= 1) {
                          removeAction("DiscountPercentage");
                          return;
                        }

                        form.setFieldValue(
                          `actions[${discountActionIndex}].rows`,
                          discountAction.rows.filter(
                            (_, currentIndex) => currentIndex !== rowIndex
                          )
                        );
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {addOnAction ? (
            <div className="overflow-hidden rounded-[6px] border border-border-tertiary bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background-disabled hover:bg-background-disabled">
                    <TableHead className="h-9 w-[180px] border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary">
                      {t("labels.type")}
                    </TableHead>
                    <TableHead className="h-9 border-r border-border-tertiary bg-background-disabled pl-4 pr-2 font-semibold text-text-primary">
                      {t("labels.addOn")}
                    </TableHead>
                    <TableHead className="h-9 w-[85px] bg-background-disabled pl-4 pr-2 text-right font-semibold text-text-primary">
                      {t("table.action")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addOnAction.items.map((item, itemIndex) => (
                    <PromotionAddOnRow
                      key={item.id}
                      form={form}
                      actionIndex={addOnActionIndex}
                      item={item}
                      itemIndex={itemIndex}
                      serviceTypes={serviceTypes}
                      onRemove={() =>
                        addOnAction.items.length <= 1
                          ? removeAction("AddOn")
                          : form.setFieldValue(
                              `actions[${addOnActionIndex}].items`,
                              addOnAction.items.filter(
                                (_, currentIndex) => currentIndex !== itemIndex
                              )
                            )
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </section>

        {rulesErrors.length > 0 ? <FormMessage errors={rulesErrors} /> : null}
      </CardContent>
    </Card>
  );
}
