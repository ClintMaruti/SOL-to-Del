import {
  MARGIN_RULES_PAGE_SIZE,
  type MarginRulesListApiResponse,
  type MarginRulesListQueryInput,
  type MarginRulesListResponse,
} from "../model/types";

function appendIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined
) {
  if (value == null) return;
  if (typeof value === "string" && value.trim().length === 0) return;
  params.set(key, String(value));
}

export function buildMarginRulesPath(
  input: MarginRulesListQueryInput,
  cursor?: string | null
) {
  const params = new URLSearchParams();

  appendIfPresent(params, "cursor", cursor);
  appendIfPresent(params, "pageSize", input.pageSize ?? MARGIN_RULES_PAGE_SIZE);
  appendIfPresent(params, "sortBy", input.sortBy ?? "agencyGroupName");
  appendIfPresent(params, "sortDirection", input.sortDirection ?? "asc");
  appendIfPresent(params, "search", input.search?.trim() ?? null);
  appendIfPresent(params, "agencyGroupId", input.agencyGroupId);
  appendIfPresent(params, "serviceTypeId", input.serviceTypeId);
  appendIfPresent(params, "supplierId", input.supplierId);
  appendIfPresent(params, "serviceId", input.serviceId);
  appendIfPresent(params, "optionId", input.optionId);
  appendIfPresent(params, "validFrom", input.validFrom);
  appendIfPresent(params, "validTo", input.validTo);
  appendIfPresent(params, "marginPercent", input.marginPercent);
  appendIfPresent(params, "hideExpired", input.hideExpired ?? false);
  appendIfPresent(params, "includeTotalCount", input.includeTotalCount ?? true);

  return `/catalog/margin-rules?${params.toString()}`;
}

export function normalizeMarginRulesResponse(
  data: MarginRulesListApiResponse | null | undefined
): MarginRulesListResponse {
  const items = Array.isArray(data?.items) ? data.items : [];
  const nextCursor =
    typeof data?.nextCursor === "string"
      ? data.nextCursor
      : typeof data?.cursor === "string"
        ? data.cursor
        : null;

  return {
    items,
    nextCursor,
    totalCount:
      typeof data?.totalCount === "number" ? data.totalCount : items.length,
  };
}
