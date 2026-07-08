import type {
  ConditionOption,
  RateRule,
  RuleComponent,
  RuleCondition,
} from "../model/types";

export type RateRuleSaveValidationErrorKey =
  | "rateRuleConditionBoundsRequired"
  | "rateRuleConditionInvalidRange"
  | "rateRuleConditionNonIntegerBound"
  | "rateRuleConditionNegativeBound"
  | "rateRuleConditionDuplicateRow"
  | "rateRulePaxConditionLimit"
  | "rateRulePaxOptionNotAllowed"
  | "rateRuleDuplicateComponentPriority"
  | "rateRuleExactDuplicateComponent"
  | "rateRuleComponentInvalidRate";

/** Non-blocking warning keys (do not block save). */
export type RateRuleSaveValidationWarningKey = "rateRuleOverlapDetected";

function isPaxTypeOption(
  option: RuleCondition["option"]
): option is ConditionOption {
  return (
    option === "ADT" || option === "CHD" || option === "INF" || option === "YTH"
  );
}

function needsNumericBounds(c: RuleCondition): boolean {
  return (
    c.condition === "Pax" ||
    c.condition === "Nights" ||
    c.condition === "Unit" ||
    c.condition === "TotalPax"
  );
}

/** Canonical key for exact duplicate component detection (all fields). */
function componentExactDuplicateKey(c: RuleComponent): string {
  const conds = c.componentConditions
    .map(
      (cc) =>
        `${cc.ageFrom ?? ""}:${cc.ageTo ?? ""}:${cc.paxFrom ?? ""}:${cc.paxTo ?? ""}:${cc.unitFrom ?? ""}:${cc.unitTo ?? ""}:${cc.nightFrom ?? ""}:${cc.nightTo ?? ""}`
    )
    .join(";");
  const dates = c.componentDates
    .map((d) => `${d.travelDateFrom}:${d.travelDateTo}`)
    .join(";");
  const bw = c.bookingWindowFrom ?? "";
  const bwTo = c.bookingWindowTo ?? "";
  const residencies = [...c.residencies].sort().join(",");

  return [
    c.priority,
    c.paxType ?? "",
    c.rateId ?? "FOC",
    c.modifier ?? "",
    c.type,
    conds,
    dates,
    `${bw}:${bwTo}`,
    residencies,
  ].join("|");
}

export interface ValidateRateRuleForSaveOptions {
  allowedPaxOptions: ConditionOption[];
  /** Ids from GET catalog service-option rates. `null` rateId (FOC) is always allowed. */
  allowedRateIds: ReadonlySet<string>;
}

export interface ValidateRateRuleForSaveResult {
  /** Hard error that blocks save, or null if none. */
  error: RateRuleSaveValidationErrorKey | null;
  /** Non-blocking warnings (save is still allowed). */
  warnings: RateRuleSaveValidationWarningKey[];
}

/**
 * Client-side validation before POST/PUT rate rule.
 * Returns hard error key (blocks save) and warnings (non-blocking).
 */
export function validateRateRuleForSave(
  rule: RateRule,
  options: ValidateRateRuleForSaveOptions
): ValidateRateRuleForSaveResult {
  const { allowedPaxOptions, allowedRateIds } = options;
  const warnings: RateRuleSaveValidationWarningKey[] = [];

  for (const c of rule.conditions) {
    if (!needsNumericBounds(c)) continue;

    const { min, max } = c;
    if (min == null && max == null) {
      return { error: "rateRuleConditionBoundsRequired", warnings };
    }
    if (min != null) {
      if (!Number.isInteger(min)) {
        return { error: "rateRuleConditionNonIntegerBound", warnings };
      }
      if (min < 0) {
        return { error: "rateRuleConditionNegativeBound", warnings };
      }
    }
    if (max != null) {
      if (!Number.isInteger(max)) {
        return { error: "rateRuleConditionNonIntegerBound", warnings };
      }
      if (max < 0) {
        return { error: "rateRuleConditionNegativeBound", warnings };
      }
    }
    if (min != null && max != null && min > max) {
      return { error: "rateRuleConditionInvalidRange", warnings };
    }
  }

  const conditionKeys = new Set<string>();
  const hasDuplicateConditionRows = rule.conditions.some((c) => {
    const key = `${c.condition}|${c.option ?? ""}|${c.min ?? ""}|${c.max ?? ""}`;
    if (conditionKeys.has(key)) return true;
    conditionKeys.add(key);
    return false;
  });
  if (hasDuplicateConditionRows) {
    return { error: "rateRuleConditionDuplicateRow", warnings };
  }

  const paxRows = rule.conditions.filter((c) => c.condition === "Pax");
  if (paxRows.length > 4) {
    return { error: "rateRulePaxConditionLimit", warnings };
  }

  const hasDisallowedPaxOption = paxRows.some(
    (c) =>
      c.option != null &&
      c.option !== "Number" &&
      (!isPaxTypeOption(c.option) || !allowedPaxOptions.includes(c.option))
  );
  if (hasDisallowedPaxOption) {
    return { error: "rateRulePaxOptionNotAllowed", warnings };
  }

  // Same priority is allowed when paxType differs — only block exact (priority + paxType) duplicates
  const priorityPaxKeys = new Set<string>();
  const hasDuplicatePriorityPaxPair = rule.components.some((co) => {
    const key = `${co.priority}|${co.paxType ?? ""}`;
    if (priorityPaxKeys.has(key)) return true;
    priorityPaxKeys.add(key);
    return false;
  });
  if (hasDuplicatePriorityPaxPair) {
    return { error: "rateRuleDuplicateComponentPriority", warnings };
  }

  // Hard-block exact duplicate components (all fields must match)
  const exactKeys = new Set<string>();
  const hasExactDuplicate = rule.components.some((co) => {
    const key = componentExactDuplicateKey(co);
    if (exactKeys.has(key)) return true;
    exactKeys.add(key);
    return false;
  });
  if (hasExactDuplicate) {
    return { error: "rateRuleExactDuplicateComponent", warnings };
  }

  const hasInvalidRateReference = rule.components.some((co) => {
    if (co.rateId === null) return false;
    return !allowedRateIds.has(co.rateId);
  });
  if (hasInvalidRateReference) {
    return { error: "rateRuleComponentInvalidRate", warnings };
  }

  return { error: null, warnings };
}
