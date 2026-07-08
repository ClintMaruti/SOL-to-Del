import type { MarginRuleSortBy } from "@/entities/margin-rule";

export const MARGIN_RULES_FILTER_KEYS = [
  "agencyGroupId",
  "serviceTypeId",
  "supplierId",
  "serviceId",
  "optionId",
  "validFrom",
  "validTo",
  "marginPercent",
] as const;

export type MarginRulesFilterKey = (typeof MARGIN_RULES_FILTER_KEYS)[number];

export interface MarginRulesFilters {
  agencyGroupId: string | null;
  serviceTypeId: string | null;
  supplierId: string | null;
  serviceId: string | null;
  optionId: string | null;
  validFrom: string | null;
  validTo: string | null;
  marginPercent: string;
}

export interface MarginRulesFilterChip {
  key: MarginRulesFilterKey;
  label: string;
  value: string;
  rawValue: string;
}

export const EMPTY_MARGIN_RULES_FILTERS: MarginRulesFilters = {
  agencyGroupId: null,
  serviceTypeId: null,
  supplierId: null,
  serviceId: null,
  optionId: null,
  validFrom: null,
  validTo: null,
  marginPercent: "",
};

export interface MarginRulesSortState {
  sortBy: MarginRuleSortBy;
  sortDirection: "asc" | "desc";
}
