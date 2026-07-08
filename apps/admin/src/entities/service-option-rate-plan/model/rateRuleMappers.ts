import type {
  ComponentCondition,
  ConditionOption,
  ConditionType,
  CreateRateRulePayload,
  ModifierType,
  RateRule,
  RateRuleComponent,
  RateRuleComponentBookingWindowPayload,
  RateRuleComponentPayload,
  RateRuleCondition,
  RateRuleConditionPayload,
  RateRuleConditionType,
  RateRuleModifierType,
  RateRuleOption,
  RateRulePaxType,
  RuleComponent,
  RuleCondition,
  UpdateRateRulePayload,
} from "./types";

const CONDITION_OPTION_TO_API: Record<ConditionOption, RateRulePaxType> = {
  ADT: "Adult",
  CHD: "Child",
  INF: "Infant",
  YTH: "Teen",
};

const CONDITION_OPTION_FROM_API: Record<RateRulePaxType, ConditionOption> = {
  Adult: "ADT",
  Child: "CHD",
  Infant: "INF",
  Teen: "YTH",
};

const CONDITION_TYPE_TO_API: Record<ConditionType, RateRuleConditionType> = {
  Pax: "Pax",
  Nights: "Nights",
  Unit: "Units",
  TotalPax: "TotalPax",
};

const CONDITION_TYPE_FROM_API: Record<RateRuleConditionType, ConditionType> = {
  Pax: "Pax",
  Nights: "Nights",
  Units: "Unit",
  TotalPax: "TotalPax",
};

const MODIFIER_TO_API: Record<ModifierType, RateRuleModifierType> = {
  "%": "Percent",
  "Fixed Amount": "FixedAmount",
};

const MODIFIER_FROM_API: Record<RateRuleModifierType, ModifierType> = {
  Percent: "%",
  FixedAmount: "Fixed Amount",
};

export interface ApiRateRule extends Omit<
  RateRule,
  "conditions" | "components"
> {
  conditions: RateRuleCondition[];
  components: RateRuleComponent[];
}

/** Optional overrides for future mapper extensions. */
export interface RateRuleMapperLookups {}

function isTempId(id: string): boolean {
  return id.startsWith("tmp-");
}

function toApiConditionOption(
  option: RuleCondition["option"]
): RateRuleOption | null {
  if (!option) return null;
  if (option === "Number") return "Number";
  if (option === "Total") return null;
  return CONDITION_OPTION_TO_API[option];
}

function fromApiConditionOption(
  option: RateRuleOption
): RuleCondition["option"] {
  if (option === "Number") return "Number";
  return CONDITION_OPTION_FROM_API[option];
}

/**
 * Maps form condition rows to API payloads. When only `max` is set, sends `min: 0`
 * (implicit lower bound). When only `min` is set, sends `max: null` (open upper bound).
 */
function toApiCondition(condition: RuleCondition): RateRuleConditionPayload {
  const option = toApiConditionOption(condition.option);
  const resolvedOption: RateRuleOption = option ?? "Number";
  let min: number | null = condition.min;
  let max: number | null = condition.max;
  if (min == null && max != null) {
    min = 0;
  }
  return {
    id: isTempId(condition.id) ? null : condition.id,
    type: CONDITION_TYPE_TO_API[condition.condition],
    option: resolvedOption,
    min,
    max,
  };
}

/**
 * Backend DateOnly fields reject `""`. Omit booking window unless both bounds are non-empty dates.
 */
function toApiBookingWindow(
  component: RuleComponent
): RateRuleComponentBookingWindowPayload | null {
  const from = component.bookingWindowFrom?.trim() ?? "";
  const to = component.bookingWindowTo?.trim() ?? "";
  if (!from || !to) return null;
  const id = component.bookingWindowId;
  return {
    id: id && !isTempId(id) ? id : null,
    from,
    to,
  };
}

function toApiComponent(component: RuleComponent): RateRuleComponentPayload {
  const firstCondition = component.componentConditions[0];

  return {
    id: isTempId(component.id) ? null : component.id,
    priority: component.priority,
    paxType: component.paxType
      ? CONDITION_OPTION_TO_API[component.paxType]
      : "Adult",
    rateId: component.rateId,
    modifierValue: component.modifier ?? 0,
    modifierType: MODIFIER_TO_API[component.type],
    isActive: true,
    ageFrom: firstCondition?.ageFrom ?? null,
    ageTo: firstCondition?.ageTo ?? null,
    paxIndexFrom: firstCondition?.paxFrom ?? null,
    paxIndexTo: firstCondition?.paxTo ?? null,
    nightIndexFrom: firstCondition?.nightFrom ?? null,
    nightIndexTo: firstCondition?.nightTo ?? null,
    unitIndexFrom: firstCondition?.unitFrom ?? null,
    unitIndexTo: firstCondition?.unitTo ?? null,
    travelDates: component.componentDates.map((d) => ({
      id: isTempId(d.id) ? null : d.id,
      from: d.travelDateFrom,
      to: d.travelDateTo,
    })),
    bookingWindow: toApiBookingWindow(component),
    residencies: component.residencies.map((residencyId) => ({
      id: null,
      residencyId,
    })),
  };
}

export function mapFormRateRuleToCreatePayload(
  rule: RateRule,
  _lookups: RateRuleMapperLookups = {}
): CreateRateRulePayload {
  return {
    name: rule.name,
    isActive: rule.isActive,
    conditions: rule.conditions.map(toApiCondition),
    components: rule.components.map((c) => toApiComponent(c)),
  };
}

export function mapFormRateRuleToUpdatePayload(
  rule: RateRule,
  _lookups: RateRuleMapperLookups = {}
): UpdateRateRulePayload {
  return {
    rateRuleId: rule.id,
    ratePlanId: rule.ratePlanId,
    name: rule.name,
    isActive: rule.isActive,
    version: rule.version,
    conditions: rule.conditions.map(toApiCondition),
    components: rule.components.map((c) => toApiComponent(c)),
  };
}

function conditionTypeFromGetRow(c: RateRuleCondition): RateRuleConditionType {
  return c.conditionType ?? c.type ?? "Pax";
}

function minMaxFromGetRow(c: RateRuleCondition): {
  min: number | null;
  max: number | null;
} {
  return {
    min: c.minValue ?? c.min ?? null,
    max: c.maxValue ?? c.max ?? null,
  };
}

/** GET flattens component conditions onto the component; omit the UI table when all scalars are unset. */
function hasAnyComponentConditionScalars(c: RateRuleComponent): boolean {
  return (
    c.ageFrom != null ||
    c.ageTo != null ||
    c.paxIndexFrom != null ||
    c.paxIndexTo != null ||
    c.nightIndexFrom != null ||
    c.nightIndexTo != null ||
    c.unitIndexFrom != null ||
    c.unitIndexTo != null
  );
}

function componentConditionsFromApiComponent(
  c: RateRuleComponent
): ComponentCondition[] {
  if (!hasAnyComponentConditionScalars(c)) return [];
  return [
    {
      id: `${c.id}-cc-0`,
      ageFrom: c.ageFrom,
      ageTo: c.ageTo,
      paxFrom: c.paxIndexFrom,
      paxTo: c.paxIndexTo,
      unitFrom: c.unitIndexFrom,
      unitTo: c.unitIndexTo,
      nightFrom: c.nightIndexFrom,
      nightTo: c.nightIndexTo,
    },
  ];
}

export function mapApiRateRuleToFormModel(
  rule: ApiRateRule,
  _lookups: RateRuleMapperLookups = {}
): RateRule {
  return {
    id: rule.id,
    ratePlanId: rule.ratePlanId,
    name: rule.name,
    isActive: rule.isActive,
    version: rule.version,
    conditions: rule.conditions.map((c) => {
      const apiType = conditionTypeFromGetRow(c);
      const { min, max } = minMaxFromGetRow(c);
      return {
        id: c.id,
        condition: CONDITION_TYPE_FROM_API[apiType],
        option: fromApiConditionOption(c.option),
        min,
        max,
      };
    }),
    components: rule.components.map((c) => ({
      id: c.id,
      priority: c.priority,
      paxType: CONDITION_OPTION_FROM_API[c.paxType],
      rateId: c.rateId,
      modifier: c.modifierValue,
      type: MODIFIER_FROM_API[c.modifierType],
      componentConditions: componentConditionsFromApiComponent(c),
      bookingWindowId: c.bookingWindow?.id ?? null,
      bookingWindowFrom: c.bookingWindow?.from ?? null,
      bookingWindowTo: c.bookingWindow?.to ?? null,
      bookingWindowFromDays: null,
      bookingWindowToDays: null,
      componentDates: c.travelDates.map((td) => ({
        id: td.id,
        travelDateFrom: td.from,
        travelDateTo: td.to,
      })),
      residencies: Array.isArray(c.residencies)
        ? c.residencies.map((r) => r.residencyId)
        : [],
    })),
  };
}
