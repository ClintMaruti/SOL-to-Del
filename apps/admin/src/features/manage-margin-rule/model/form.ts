import type { TFunction } from "i18next";

import {
  getTomorrowIsoDate,
  isMarginRuleActive,
  isMarginRuleFuture,
  type CreateMarginRulePayload,
  type MarginRule,
  type MarginRuleModalMode,
  type UpdateMarginRulePayload,
} from "@/entities/margin-rule";

import {
  ANY_SCOPE_VALUE,
  EMPTY_MARGIN_RULE_FORM_VALUES,
  type MarginRuleCacheItemShape,
  type MarginRuleFieldErrors,
  type MarginRuleFormValues,
} from "./types";

function normalizeNullableScopeValue(value: string): string | null {
  return !value || value === ANY_SCOPE_VALUE ? null : value;
}

function normalizeMarginRulePayloadValidTo(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getInitialMarginRuleFormValues(
  mode: MarginRuleModalMode,
  rule?: MarginRule | null
): MarginRuleFormValues {
  if (!rule || mode === "create") {
    return EMPTY_MARGIN_RULE_FORM_VALUES;
  }

  return {
    agencyGroupId: rule.agencyGroupId,
    serviceTypeId: rule.serviceTypeNameId ?? ANY_SCOPE_VALUE,
    supplierId: rule.supplierId ?? ANY_SCOPE_VALUE,
    serviceId: rule.serviceId ?? ANY_SCOPE_VALUE,
    optionId: rule.optionId ?? ANY_SCOPE_VALUE,
    validFrom: rule.validFrom,
    validTo: rule.validTo ?? "",
    marginPercent: String(Number(rule.marginPercent)),
  };
}

export function getMarginRuleFieldErrors(
  values: MarginRuleFormValues,
  mode: MarginRuleModalMode,
  t: TFunction<["admin", "common"]>,
  sourceRule?: MarginRule | null,
  todayIsoDate?: string
): MarginRuleFieldErrors {
  const nextErrors: MarginRuleFieldErrors = {};
  const normalizedTodayIsoDate = todayIsoDate;
  const isActiveEdit =
    mode === "edit" &&
    sourceRule != null &&
    normalizedTodayIsoDate != null &&
    isMarginRuleActive(sourceRule, normalizedTodayIsoDate);

  if (!values.agencyGroupId) {
    nextErrors.agencyGroupId = t("validation.required", {
      field: t("labels.agencyGroup"),
    });
  }

  if (!values.serviceTypeId) {
    nextErrors.serviceTypeId = t("validation.required", {
      field: t("labels.serviceType"),
    });
  }

  if (!values.validFrom) {
    nextErrors.validFrom = t("validation.required", {
      field: t("labels.validFrom"),
    });
  }

  if (values.validFrom && values.validTo && values.validFrom > values.validTo) {
    nextErrors.validTo = t("validation.validToMustBeAfterValidFrom");
  }

  if (isActiveEdit && values.validTo) {
    const minimumActiveValidTo = getTomorrowIsoDate(normalizedTodayIsoDate);

    if (values.validTo < minimumActiveValidTo) {
      nextErrors.validTo = t("errors.marginRuleActiveValidToMinimum");
    }
  }

  if (!values.marginPercent.trim()) {
    nextErrors.marginPercent = t("validation.required", {
      field: t("labels.marginPercent"),
    });
  } else {
    const parsedMarginPercent = Number(values.marginPercent);

    if (!Number.isFinite(parsedMarginPercent) || parsedMarginPercent < 0) {
      nextErrors.marginPercent = t("validation.fieldMustBeZeroOrGreater", {
        field: t("labels.marginPercent"),
      });
    }
  }

  if (!normalizeNullableScopeValue(values.supplierId)) {
    if (normalizeNullableScopeValue(values.serviceId)) {
      nextErrors.serviceId = t("errors.marginRuleServiceRequiresSupplier");
    }

    if (normalizeNullableScopeValue(values.optionId)) {
      nextErrors.optionId = t("errors.marginRuleOptionRequiresService");
    }
  } else if (!normalizeNullableScopeValue(values.serviceId)) {
    if (normalizeNullableScopeValue(values.optionId)) {
      nextErrors.optionId = t("errors.marginRuleOptionRequiresService");
    }
  }

  return nextErrors;
}

export function toCreateMarginRulePayload(
  values: MarginRuleFormValues
): CreateMarginRulePayload {
  return {
    agencyGroupId: values.agencyGroupId,
    serviceTypeId: normalizeNullableScopeValue(values.serviceTypeId),
    supplierId: normalizeNullableScopeValue(values.supplierId),
    serviceId: normalizeNullableScopeValue(values.serviceId),
    optionId: normalizeNullableScopeValue(values.optionId),
    validFrom: values.validFrom,
    validTo: normalizeMarginRulePayloadValidTo(values.validTo),
    marginPercent: Number(values.marginPercent),
  };
}

export function toUpdateMarginRulePayload(
  values: MarginRuleFormValues,
  version: number
): UpdateMarginRulePayload {
  return {
    ...toCreateMarginRulePayload(values),
    version,
  };
}

export function buildMarginRuleCacheItem(
  values: MarginRuleFormValues,
  labels: {
    agencyGroupName: string;
    serviceTypeName: string | null;
    supplierName: string | null;
    serviceName: string | null;
    optionName: string | null;
  }
): MarginRuleCacheItemShape {
  return {
    agencyGroupId: values.agencyGroupId,
    agencyGroupName: labels.agencyGroupName,
    serviceTypeNameId: normalizeNullableScopeValue(values.serviceTypeId),
    serviceTypeName: labels.serviceTypeName,
    supplierId: normalizeNullableScopeValue(values.supplierId),
    supplierName: labels.supplierName,
    serviceId: normalizeNullableScopeValue(values.serviceId),
    serviceName: labels.serviceName,
    optionId: normalizeNullableScopeValue(values.optionId),
    optionName: labels.optionName,
    validFrom: values.validFrom,
    validTo: normalizeMarginRulePayloadValidTo(values.validTo),
    marginPercent: Number(values.marginPercent),
  };
}

export function isMarginRuleFormLocked(
  mode: MarginRuleModalMode,
  rule: MarginRule | null | undefined,
  todayIsoDate: string
) {
  if (mode !== "edit" || !rule) {
    return false;
  }

  return (
    !isMarginRuleFuture(rule, todayIsoDate) &&
    isMarginRuleActive(rule, todayIsoDate)
  );
}
