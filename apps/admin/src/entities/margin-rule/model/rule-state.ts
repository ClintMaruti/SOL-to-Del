import type { MarginRule } from "./types";

export function toLocalIsoDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTomorrowIsoDate(
  todayIsoDate: string = toLocalIsoDateString()
) {
  const tomorrow = new Date(`${todayIsoDate}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return toLocalIsoDateString(tomorrow);
}

export function isMarginRuleFuture(
  rule: Pick<MarginRule, "validFrom">,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return rule.validFrom > todayIsoDate;
}

export function isMarginRulePast(
  rule: Pick<MarginRule, "validTo">,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return rule.validTo != null && rule.validTo < todayIsoDate;
}

export function isMarginRuleActive(
  rule: Pick<MarginRule, "validFrom" | "validTo">,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return (
    rule.validFrom <= todayIsoDate &&
    (rule.validTo == null || rule.validTo >= todayIsoDate)
  );
}

export function isMarginRuleEditable(
  rule: Pick<MarginRule, "validFrom" | "validTo">,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return (
    isMarginRuleFuture(rule, todayIsoDate) ||
    isMarginRuleActive(rule, todayIsoDate)
  );
}

export function isMarginRuleDeletable(
  rule: Pick<MarginRule, "validFrom">,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return isMarginRuleFuture(rule, todayIsoDate);
}
