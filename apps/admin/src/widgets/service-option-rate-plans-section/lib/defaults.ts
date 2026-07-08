import type {
  ComponentCondition,
  ComponentDateRow,
  RateRule,
  RuleComponent,
  RuleCondition,
} from "@/entities/service-option-rate-plan";

function tempId(prefix: string): string {
  return `tmp-${prefix}-${crypto.randomUUID()}`;
}

export function createCondition(): RuleCondition {
  return {
    id: tempId("condition"),
    condition: "Pax",
    option: null,
    min: null,
    max: null,
  };
}

export function createComponent(): RuleComponent {
  return {
    id: tempId("component"),
    priority: 100,
    paxType: null,
    rateId: null,
    modifier: null,
    type: "%",
    componentConditions: [],
    bookingWindowId: tempId("component-bw"),
    bookingWindowFrom: null,
    bookingWindowTo: null,
    bookingWindowFromDays: null,
    bookingWindowToDays: null,
    componentDates: [],
    residencies: [],
  };
}

export function createComponentCondition(): ComponentCondition {
  return {
    id: tempId("component-condition"),
    ageFrom: null,
    ageTo: null,
    paxFrom: null,
    paxTo: null,
    unitFrom: null,
    unitTo: null,
    nightFrom: null,
    nightTo: null,
  };
}

export function createComponentDateRow(): ComponentDateRow {
  return {
    id: tempId("component-date"),
    travelDateFrom: "",
    travelDateTo: "",
  };
}

export function createRateRule(ratePlanId: string): RateRule {
  return {
    id: tempId("rate-rule"),
    ratePlanId,
    name: "Rate Rule",
    isActive: true,
    version: 0,
    conditions: [],
    components: [],
  };
}
