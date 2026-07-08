import type { ServiceRate } from "@/entities/service-rate";
import {
  validateRateRuleForSave,
  type ConditionOption,
  type RateRule,
  type RateRuleSaveValidationWarningKey,
  type ValidateRateRuleForSaveOptions,
  type ValidateRateRuleForSaveResult,
} from "@/entities/service-option-rate-plan";

export const DEFAULT_RATE_RULE_PAX_OPTIONS: ConditionOption[] = [
  "ADT",
  "CHD",
  "INF",
  "YTH",
];

export function buildRateRuleValidationOptions(
  rates: Pick<ServiceRate, "id">[],
  allowedPaxOptions: ConditionOption[] = DEFAULT_RATE_RULE_PAX_OPTIONS
): ValidateRateRuleForSaveOptions {
  return {
    allowedPaxOptions,
    allowedRateIds: new Set(rates.map((r) => r.id)),
  };
}

function numericRangesOverlap(
  minA: number | null,
  maxA: number | null,
  minB: number | null,
  maxB: number | null
): boolean {
  const aMin = minA ?? Number.NEGATIVE_INFINITY;
  const aMax = maxA ?? Number.POSITIVE_INFINITY;
  const bMin = minB ?? Number.NEGATIVE_INFINITY;
  const bMax = maxB ?? Number.POSITIVE_INFINITY;
  return aMin <= bMax && bMin <= aMax;
}

/** Conservative: two rules may overlap when they share a condition row type/option with overlapping min/max. */
export function rateRulesConditionsOverlap(a: RateRule, b: RateRule): boolean {
  if (a.id === b.id) return false;
  if (a.conditions.length === 0 || b.conditions.length === 0) return false;

  for (const ca of a.conditions) {
    for (const cb of b.conditions) {
      if (ca.condition !== cb.condition) continue;
      if ((ca.option ?? "") !== (cb.option ?? "")) continue;
      if (numericRangesOverlap(ca.min, ca.max, cb.min, cb.max)) {
        return true;
      }
    }
  }
  return false;
}

export function detectRateRuleOverlapWarning(
  rule: RateRule,
  allRulesOnPlan: RateRule[]
): boolean {
  return allRulesOnPlan.some(
    (other) => other.id !== rule.id && rateRulesConditionsOverlap(rule, other)
  );
}

/** Single-rule validation plus optional cross-rule overlap warning (non-blocking). */
export function validateRateRuleForPlanSave(
  rule: RateRule,
  allRulesOnPlan: RateRule[],
  options: ValidateRateRuleForSaveOptions
): ValidateRateRuleForSaveResult {
  const base = validateRateRuleForSave(rule, options);
  if (base.error) return base;

  const warnings: RateRuleSaveValidationWarningKey[] = [...base.warnings];
  if (
    detectRateRuleOverlapWarning(rule, allRulesOnPlan) &&
    !warnings.includes("rateRuleOverlapDetected")
  ) {
    warnings.push("rateRuleOverlapDetected");
  }
  return { error: null, warnings };
}

/** Indices of components that share the same priority + paxType pair (hard error case). */
export function componentIndicesWithDuplicatePriorityPax(
  components: RateRule["components"]
): Set<number> {
  const indexByKey = new Map<string, number>();
  const conflicts = new Set<number>();
  components.forEach((co, index) => {
    const key = `${co.priority}|${co.paxType ?? ""}`;
    const first = indexByKey.get(key);
    if (first !== undefined) {
      conflicts.add(first);
      conflicts.add(index);
    } else {
      indexByKey.set(key, index);
    }
  });
  return conflicts;
}
