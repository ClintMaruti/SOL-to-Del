export type ConditionType = "Pax" | "Nights" | "Unit" | "TotalPax";

export type ConditionOption = "ADT" | "CHD" | "INF" | "YTH";

export type ModifierType = "%" | "Fixed Amount";

/** Catalog residency option from GET /api/catalog/rate-rules/residencies. */
export interface RateRuleResidencyOption {
  id: string;
  name: string;
}

export interface ComponentCondition {
  id: string;
  ageFrom: number | null;
  ageTo: number | null;
  paxFrom: number | null;
  paxTo: number | null;
  unitFrom: number | null;
  unitTo: number | null;
  nightFrom: number | null;
  nightTo: number | null;
}

export interface ComponentDateRow {
  id: string;
  travelDateFrom: string;
  travelDateTo: string;
}

export interface RuleComponent {
  id: string;
  priority: number;
  paxType: ConditionOption | null;
  /**
   * Catalog rate id from GET .../services/options/.../rates, or `null` for FOC (free of charge; API `rateId: null`).
   */
  rateId: string | null;
  modifier: number | null;
  type: ModifierType;
  componentConditions: ComponentCondition[];
  /** Persisted booking window row id from API; temp ids omitted on save. */
  bookingWindowId: string | null;
  bookingWindowFrom: string | null;
  bookingWindowTo: string | null;
  bookingWindowFromDays: number | null;
  bookingWindowToDays: number | null;
  componentDates: ComponentDateRow[];
  /** Selected catalog residency ids (see {@link RateRuleResidencyOption}). */
  residencies: string[];
}

export interface RuleCondition {
  id: string;
  condition: ConditionType;
  option: ConditionOption | "Total" | "Number" | null;
  min: number | null;
  max: number | null;
}

export interface RateRule {
  id: string;
  ratePlanId: string;
  name: string;
  isActive: boolean;
  version: number;
  conditions: RuleCondition[];
  components: RuleComponent[];
}

/** List / create / update summary */
export interface RatePlan {
  id: string;
  serviceId: string;
  name: string;
  validityDateFrom: string;
  validityDateTo: string | null;
  payAtProperty: boolean;
  isActive: boolean;
  version: number;
}

/**
 * POST `/api/catalog/services/{serviceId}/rate-plans`
 * Request body. Response is {@link RatePlan}.
 */
export interface CreateRatePlanRequestPayload {
  name: string;
  validityDateFrom: string;
  validityDateTo?: string | null;
  payAtProperty: boolean;
  isActive?: boolean;
}

/**
 * PUT `/api/catalog/services/rate-plans/{id}` request body.
 * Response is {@link RatePlan}.
 */
export interface UpdateRatePlanPayload extends Omit<
  CreateRatePlanRequestPayload,
  "isActive"
> {
  version: number;
}

/** Backend enum values for rate-rule condition type payloads. */
export type RateRuleConditionType = "Pax" | "Nights" | "Units" | "TotalPax";

/** Backend enum values for rate-rule condition options/pax type payloads. */
export type RateRuleOption = "Adult" | "Child" | "Infant" | "Teen" | "Number";
export type RateRulePaxType = Exclude<RateRuleOption, "Number">;
export type RateRuleModifierType = "Percent" | "FixedAmount";

/**
 * Rule-level condition row as returned by GET rate rules.
 * Some backends use `conditionType` / `minValue` / `maxValue`; others use `type` / `min` / `max`.
 * The mapper accepts either set.
 */
export interface RateRuleCondition {
  id: string;
  rateRuleId: string;
  conditionType?: RateRuleConditionType;
  type?: RateRuleConditionType;
  option: RateRuleOption;
  minValue?: number | null;
  maxValue?: number | null;
  min?: number | null;
  max?: number | null;
  version: number;
}

export interface RateRuleComponentCondition {
  id: string;
  rateComponentId: string;
  ageFrom: number | null;
  ageTo: number | null;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
  unitIndexFrom: number | null;
  unitIndexTo: number | null;
  version: number;
}

export interface RateRuleComponentTravelDate {
  id: string;
  rateComponentId: string;
  from: string;
  to: string;
  version: number;
}

export interface RateRuleComponentBookingWindow {
  id: string;
  rateComponentId: string;
  from: string;
  to: string;
  version: number;
}

export interface RateRuleComponentResidency {
  id: string;
  rateComponentId: string;
  residencyId: string;
  version: number;
}

/**
 * Component row as returned by GET rate rules: index/scalar fields are flat on the component
 * (not a nested `conditions` array).
 */
export interface RateRuleComponent {
  id: string;
  rateRuleId: string;
  priority: number;
  paxType: RateRulePaxType;
  rateId: string | null;
  modifierValue: number;
  modifierType: RateRuleModifierType;
  isActive: boolean;
  version: number;
  ageFrom: number | null;
  ageTo: number | null;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
  unitIndexFrom: number | null;
  unitIndexTo: number | null;
  travelDates: RateRuleComponentTravelDate[];
  bookingWindow: RateRuleComponentBookingWindow | null;
  residencies: RateRuleComponentResidency[];
}

export interface RateRuleConditionPayload {
  id: string | null;
  type: RateRuleConditionType;
  option: RateRuleOption;
  /** At least one of min/max should be set; max-only implies min 0 on the server when omitted. */
  min: number | null;
  max: number | null;
}

export interface RateRuleComponentConditionPayload {
  id: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
  unitIndexFrom: number | null;
  unitIndexTo: number | null;
}

export interface RateRuleComponentTravelDatePayload {
  id: string | null;
  from: string;
  to: string;
}

export interface RateRuleComponentBookingWindowPayload {
  id: string | null;
  from: string;
  to: string;
}

export interface RateRuleComponentResidencyPayload {
  id: string | null;
  residencyId: string;
}

export interface RateRuleComponentPayload {
  id: string | null;
  priority: number;
  paxType: RateRulePaxType;
  rateId: string | null;
  modifierValue: number;
  modifierType: RateRuleModifierType;
  isActive: boolean;
  ageFrom: number | null;
  ageTo: number | null;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
  unitIndexFrom: number | null;
  unitIndexTo: number | null;
  travelDates: RateRuleComponentTravelDatePayload[];
  bookingWindow: RateRuleComponentBookingWindowPayload | null;
  residencies: RateRuleComponentResidencyPayload[];
}

export interface CreateRateRulePayload {
  name: string;
  isActive: boolean;
  conditions: RateRuleConditionPayload[];
  components: RateRuleComponentPayload[];
}

/** PUT `/api/catalog/rate-rules/{rateRuleId}` request body (must match path). */
export interface UpdateRateRulePayload {
  rateRuleId: string;
  name: string;
  isActive: boolean;
  ratePlanId: string;
  version: number;
  conditions: RateRuleConditionPayload[];
  components: RateRuleComponentPayload[];
}
