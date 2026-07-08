import type { QueryClient } from "@tanstack/react-query";

import { api } from "@sol/api-client";

import {
  mapFormRateRuleToCreatePayload,
  ratePlanRateRulesUrl,
  rateRulesQueryKey,
  type RatePlan,
  type RateRule,
  type RuleComponent,
} from "@/entities/service-option-rate-plan";
import type { RatePlanFormValues } from "@/features/manage-service-option-rate-plans";

function tempRatePlanId(): string {
  return `tmp-rate-plan-${crypto.randomUUID()}`;
}

function tempId(prefix: string): string {
  return `tmp-${prefix}-${crypto.randomUUID()}`;
}

/** Suffix for duplicated rate plan names (matches rate rule duplicate pattern). */
export const RATE_PLAN_DUPLICATE_NAME_SUFFIX = " (copy)";

export function buildDuplicateRatePlanName(sourceName: string): string {
  const trimmed = sourceName.trim();
  return trimmed ? `${trimmed}${RATE_PLAN_DUPLICATE_NAME_SUFFIX}` : "(copy)";
}

function remapRuleComponent(comp: RuleComponent): RuleComponent {
  const newCompId = tempId("component");
  return {
    ...comp,
    id: newCompId,
    componentConditions: comp.componentConditions.map((cc) => ({
      ...cc,
      id: tempId("component-condition"),
    })),
    componentDates: comp.componentDates.map((cd) => ({
      ...cd,
      id: tempId("component-date"),
    })),
    bookingWindowId:
      comp.bookingWindowId && !comp.bookingWindowId.startsWith("tmp-")
        ? tempId("component-bw")
        : comp.bookingWindowId,
  };
}

/** Deep-clone rate rules for a duplicated draft rate plan (fresh temp ids, target plan id). */
export function cloneRateRulesForRatePlanDuplicate(
  rules: RateRule[],
  targetRatePlanId: string
): RateRule[] {
  return rules.map((rule) => {
    const newRuleId = tempId("rate-rule");
    return {
      ...rule,
      id: newRuleId,
      ratePlanId: targetRatePlanId,
      version: 0,
      conditions: rule.conditions.map((c) => ({
        ...c,
        id: tempId("condition"),
      })),
      components: rule.components.map((c) => remapRuleComponent(c)),
    };
  });
}

export function createDuplicateRatePlanDraft(
  source: RatePlan,
  sourceRules: RateRule[] = []
): {
  ratePlan: RatePlan;
  initialValues: RatePlanFormValues;
  initialRateRules: RateRule[];
} {
  const initialValues: RatePlanFormValues = {
    name: buildDuplicateRatePlanName(source.name),
    validityDateFrom: source.validityDateFrom,
    validityDateTo: source.validityDateTo,
    payAtProperty: source.payAtProperty,
    isActive: false,
    version: 0,
  };

  const ratePlan: RatePlan = {
    id: tempRatePlanId(),
    serviceId: source.serviceId,
    ...initialValues,
  };

  const initialRateRules = cloneRateRulesForRatePlanDuplicate(
    sourceRules,
    ratePlan.id
  );

  return { ratePlan, initialValues, initialRateRules };
}

/** POST cloned draft rate rules after the duplicated rate plan header is saved. */
export async function persistDuplicatedRateRulesToPlan(
  createdRatePlanId: string,
  rules: RateRule[],
  queryClient: QueryClient
): Promise<void> {
  for (const rule of rules) {
    const payload = mapFormRateRuleToCreatePayload({
      ...rule,
      ratePlanId: createdRatePlanId,
    });
    await api.post(ratePlanRateRulesUrl(createdRatePlanId), payload);
  }
  await queryClient.invalidateQueries({
    queryKey: rateRulesQueryKey(createdRatePlanId),
  });
}
