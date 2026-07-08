import type { MarginRulesListQueryInput } from "./types";

export const MARGIN_RULES_QUERY_KEY = ["margin-rules"] as const;

export function getMarginRulesListQueryKey(params: MarginRulesListQueryInput) {
  return [...MARGIN_RULES_QUERY_KEY, params] as const;
}
