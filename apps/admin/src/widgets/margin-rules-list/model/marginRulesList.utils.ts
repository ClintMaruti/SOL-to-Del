import type { TFunction } from "i18next";
import type { MouseEvent } from "react";

import {
  getServiceOptionLabel,
  getSupplierServiceLabel,
} from "@/shared/lib/catalog-service.utils";
import { formatDate } from "@/shared/lib";
import type { DropdownSelectOption } from "@/shared/ui";

import type {
  MarginRulesFilterChip,
  MarginRulesFilterKey,
  MarginRulesFilters,
} from "./types";

export const FIRST_LINE_CONTENT_GAP_PX = 12;
export const FILTER_CHIP_GAP_PX = 4;

export interface MarginRuleChipLabelMap {
  agencyGroupMap: Map<string, string>;
  serviceTypeMap: Map<string, string>;
  supplierMap: Map<string, string>;
  serviceMap: Map<string, string>;
  optionMap: Map<string, string>;
}

export function byLabelAsc(
  left: { label?: string | null },
  right: { label?: string | null }
): number {
  return (left.label ?? "").localeCompare(right.label ?? "");
}

export function toDropdownOption(
  value: string,
  label: string | null | undefined
): DropdownSelectOption {
  return { value, label: label ?? value };
}

export function preventMarginRulesAction(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function getVisibleFilterChipCount(
  chipWidths: number[],
  availableWidth: number,
  dotWidth: number
) {
  if (chipWidths.length === 0) {
    return 0;
  }

  const totalChipWidth = chipWidths.reduce((total, width, index) => {
    return total + width + (index > 0 ? FILTER_CHIP_GAP_PX : 0);
  }, 0);

  if (totalChipWidth <= availableWidth) {
    return chipWidths.length;
  }

  let visibleWidth = 0;
  let visibleChipCount = 0;

  for (const [index, width] of chipWidths.entries()) {
    const nextVisibleWidth =
      visibleChipCount === 0
        ? width
        : visibleWidth + FILTER_CHIP_GAP_PX + width;
    const hasHiddenChipsAfterCurrent = index < chipWidths.length - 1;
    const totalWidthWithOverflowToggle = hasHiddenChipsAfterCurrent
      ? nextVisibleWidth + FILTER_CHIP_GAP_PX + dotWidth
      : nextVisibleWidth;

    if (totalWidthWithOverflowToggle > availableWidth) {
      break;
    }

    visibleWidth = nextVisibleWidth;
    visibleChipCount = index + 1;
  }

  return visibleChipCount;
}

export function createChipLabelMap({
  agencyGroups,
  serviceTypes,
  suppliers,
  appliedSupplierServices,
  appliedServiceOptions,
}: {
  agencyGroups: Array<{ id: string; name: string }>;
  serviceTypes: Array<{
    id: string;
    name: string;
    displayName?: string | null;
  }>;
  suppliers: Array<{ id: string; name: string }>;
  appliedSupplierServices: Array<{ id: string; name: string }>;
  appliedServiceOptions: Array<{
    id: string;
    title?: string | null;
    name?: string | null;
  }>;
}): MarginRuleChipLabelMap {
  return {
    agencyGroupMap: new Map(
      agencyGroups.map((agencyGroup) => [
        agencyGroup.id,
        agencyGroup.name ?? agencyGroup.id,
      ])
    ),
    serviceTypeMap: new Map(
      serviceTypes.map((serviceType) => [
        serviceType.id,
        serviceType.displayName || serviceType.name || serviceType.id,
      ])
    ),
    supplierMap: new Map(
      suppliers.map((supplier) => [supplier.id, supplier.name ?? supplier.id])
    ),
    serviceMap: new Map(
      appliedSupplierServices.map((service) => [
        service.id,
        getSupplierServiceLabel(service),
      ])
    ),
    optionMap: new Map(
      appliedServiceOptions.map((option) => [
        option.id,
        getServiceOptionLabel(option),
      ])
    ),
  };
}

export function createAppliedFilterChips({
  appliedFilterOrder,
  appliedFilters,
  chipLabelMap,
  t,
}: {
  appliedFilterOrder: MarginRulesFilterKey[];
  appliedFilters: MarginRulesFilters;
  chipLabelMap: MarginRuleChipLabelMap;
  t: TFunction<["admin", "common"]>;
}): MarginRulesFilterChip[] {
  return appliedFilterOrder.reduce<MarginRulesFilterChip[]>((chips, key) => {
    const value = appliedFilters[key];

    if (value == null || value === "") {
      return chips;
    }

    switch (key) {
      case "agencyGroupId":
        chips.push({
          key,
          label: t("labels.agencyGroup"),
          value:
            chipLabelMap.agencyGroupMap.get(value as string) ?? String(value),
          rawValue: String(value),
        });
        return chips;
      case "serviceTypeId":
        chips.push({
          key,
          label: t("labels.serviceType"),
          value:
            chipLabelMap.serviceTypeMap.get(value as string) ?? String(value),
          rawValue: String(value),
        });
        return chips;
      case "supplierId":
        chips.push({
          key,
          label: t("labels.supplier"),
          value: chipLabelMap.supplierMap.get(value as string) ?? String(value),
          rawValue: String(value),
        });
        return chips;
      case "serviceId":
        chips.push({
          key,
          label: t("labels.service"),
          value: chipLabelMap.serviceMap.get(value as string) ?? String(value),
          rawValue: String(value),
        });
        return chips;
      case "optionId":
        chips.push({
          key,
          label: t("labels.option"),
          value: chipLabelMap.optionMap.get(value as string) ?? String(value),
          rawValue: String(value),
        });
        return chips;
      case "validFrom":
        chips.push({
          key,
          label: t("labels.validFrom"),
          value: formatDate(String(value)),
          rawValue: String(value),
        });
        return chips;
      case "validTo":
        chips.push({
          key,
          label: t("labels.validTo"),
          value: formatDate(String(value)),
          rawValue: String(value),
        });
        return chips;
      case "marginPercent":
        chips.push({
          key,
          label: t("labels.marginPercent"),
          value: String(value),
          rawValue: String(value),
        });
        return chips;
      default:
        return chips;
    }
  }, []);
}
