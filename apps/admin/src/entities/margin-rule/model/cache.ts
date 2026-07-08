import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";

import { MARGIN_RULES_QUERY_KEY } from "./queryKeys";
import { toLocalIsoDateString } from "./rule-state";
import type {
  MarginRule,
  MarginRulesListQueryInput,
  MarginRulesListResponse,
} from "./types";

const ANY_SORT_VALUE = "ANY";

type MarginRulesInfiniteData = InfiniteData<
  MarginRulesListResponse,
  string | null
>;

function isMarginRulesInfiniteData(
  value: unknown
): value is MarginRulesInfiniteData {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Array.isArray((value as { pages?: unknown }).pages);
}

function isMarginRulesListQueryKey(
  queryKey: QueryKey
): queryKey is readonly [
  (typeof MARGIN_RULES_QUERY_KEY)[number],
  MarginRulesListQueryInput,
] {
  return (
    Array.isArray(queryKey) &&
    queryKey.length >= 2 &&
    queryKey[0] === MARGIN_RULES_QUERY_KEY[0] &&
    typeof queryKey[1] === "object" &&
    queryKey[1] !== null
  );
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function getSortValue(
  rule: MarginRule,
  sortBy: MarginRulesListQueryInput["sortBy"]
): string | number {
  switch (sortBy) {
    case "serviceType":
      return rule.serviceTypeName ?? ANY_SORT_VALUE;
    case "supplierName":
      return rule.supplierName ?? ANY_SORT_VALUE;
    case "serviceName":
      return rule.serviceName ?? ANY_SORT_VALUE;
    case "optionName":
      return rule.optionName ?? ANY_SORT_VALUE;
    case "validFrom":
      return rule.validFrom;
    case "validTo":
      return rule.validTo ?? "9999-12-31";
    case "marginPercent":
      return rule.marginPercent;
    case "agencyGroupName":
    default:
      return rule.agencyGroupName;
  }
}

export function compareMarginRules(
  left: MarginRule,
  right: MarginRule,
  sortBy: MarginRulesListQueryInput["sortBy"] = "agencyGroupName",
  sortDirection: MarginRulesListQueryInput["sortDirection"] = "asc"
): number {
  const leftValue = getSortValue(left, sortBy);
  const rightValue = getSortValue(right, sortBy);
  const direction = sortDirection === "desc" ? -1 : 1;

  let result = 0;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    result = leftValue - rightValue;
  } else {
    result = compareStrings(String(leftValue), String(rightValue));
  }

  if (result === 0) {
    result = compareStrings(left.id, right.id);
  }

  return result * direction;
}

function matchesDateRange(
  rule: MarginRule,
  validFrom: string | null | undefined,
  validTo: string | null | undefined
): boolean {
  const ruleEnd = rule.validTo;

  if (validFrom && validTo) {
    return (
      rule.validFrom <= validTo && (ruleEnd == null || ruleEnd >= validFrom)
    );
  }

  if (validFrom) {
    return ruleEnd == null || ruleEnd >= validFrom;
  }

  if (validTo) {
    return rule.validFrom <= validTo;
  }

  return true;
}

function matchesSearch(
  rule: MarginRule,
  search: string | null | undefined
): boolean {
  const normalizedSearch = search?.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [rule.agencyGroupName, rule.supplierName ?? ""].some((value) =>
    value.toLowerCase().includes(normalizedSearch)
  );
}

export function matchesMarginRulesQuery(
  rule: MarginRule,
  params: MarginRulesListQueryInput,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  const parsedMarginPercent =
    params.marginPercent == null || params.marginPercent === ""
      ? null
      : Number(params.marginPercent);

  if (
    params.hideExpired &&
    rule.validTo != null &&
    rule.validTo < todayIsoDate
  ) {
    return false;
  }

  return (
    matchesSearch(rule, params.search) &&
    (!params.agencyGroupId || rule.agencyGroupId === params.agencyGroupId) &&
    (!params.serviceTypeId ||
      rule.serviceTypeNameId === params.serviceTypeId) &&
    (!params.supplierId || rule.supplierId === params.supplierId) &&
    (!params.serviceId || rule.serviceId === params.serviceId) &&
    (!params.optionId || rule.optionId === params.optionId) &&
    matchesDateRange(rule, params.validFrom, params.validTo) &&
    (parsedMarginPercent == null || rule.marginPercent === parsedMarginPercent)
  );
}

function flattenItems(data: MarginRulesInfiniteData): MarginRule[] {
  return data.pages.flatMap((page) => page.items);
}

function repaginateItems(
  data: MarginRulesInfiniteData,
  items: MarginRule[],
  totalCount: number
): MarginRulesInfiniteData {
  const pageLengths = data.pages.map((page) => page.items.length);
  let cursor = 0;

  const pages = data.pages.map((page, index) => {
    const nextCursor = page.nextCursor ?? null;
    const isLastPage = index === data.pages.length - 1;
    const nextCursorIndex = isLastPage
      ? items.length
      : cursor + pageLengths[index];
    const nextItems = items.slice(cursor, nextCursorIndex);

    cursor = nextCursorIndex;

    return {
      ...page,
      items: nextItems,
      totalCount,
      nextCursor,
    };
  });

  return {
    ...data,
    pages,
  };
}

function insertIntoLoadedWindow(
  data: MarginRulesInfiniteData,
  nextRule: MarginRule,
  params: MarginRulesListQueryInput
): MarginRulesInfiniteData {
  const loadedItems = flattenItems(data);
  const hasMorePages = Boolean(data.pages[data.pages.length - 1]?.nextCursor);
  const sortedItems = [...loadedItems, nextRule].sort((left, right) =>
    compareMarginRules(left, right, params.sortBy, params.sortDirection)
  );

  const shouldTrim = hasMorePages && loadedItems.length > 0;
  const nextItems = shouldTrim
    ? sortedItems.slice(0, loadedItems.length)
    : sortedItems;

  return repaginateItems(data, nextItems, data.pages[0]?.totalCount + 1);
}

export function insertMarginRuleIntoInfiniteCaches(
  queryClient: QueryClient,
  nextRule: MarginRule,
  todayIsoDate: string = toLocalIsoDateString()
) {
  queryClient
    .getQueryCache()
    .findAll({ queryKey: [...MARGIN_RULES_QUERY_KEY] })
    .forEach(({ queryKey }) => {
      if (!isMarginRulesListQueryKey(queryKey)) {
        return;
      }

      const params = queryKey[1];

      if (!matchesMarginRulesQuery(nextRule, params, todayIsoDate)) {
        return;
      }

      queryClient.setQueryData(queryKey, (previous) => {
        if (!isMarginRulesInfiniteData(previous)) {
          return previous;
        }

        const loadedItems = flattenItems(previous);
        const hasMorePages = Boolean(
          previous.pages[previous.pages.length - 1]?.nextCursor
        );

        if (loadedItems.some((item) => item.id === nextRule.id)) {
          return previous;
        }

        if (!hasMorePages || loadedItems.length === 0) {
          return insertIntoLoadedWindow(previous, nextRule, params);
        }

        const lastLoadedItem = loadedItems[loadedItems.length - 1];
        const belongsInLoadedWindow =
          compareMarginRules(
            nextRule,
            lastLoadedItem,
            params.sortBy,
            params.sortDirection
          ) <= 0;

        if (!belongsInLoadedWindow) {
          const totalCount =
            (previous.pages[0]?.totalCount ?? loadedItems.length) + 1;
          return repaginateItems(previous, loadedItems, totalCount);
        }

        return insertIntoLoadedWindow(previous, nextRule, params);
      });
    });
}

export function updateMarginRuleInInfiniteCaches(
  queryClient: QueryClient,
  previousRule: MarginRule,
  nextRule: MarginRule,
  todayIsoDate: string = toLocalIsoDateString()
) {
  queryClient
    .getQueryCache()
    .findAll({ queryKey: [...MARGIN_RULES_QUERY_KEY] })
    .forEach(({ queryKey }) => {
      if (!isMarginRulesListQueryKey(queryKey)) {
        return;
      }

      const params = queryKey[1];

      queryClient.setQueryData(queryKey, (cached) => {
        if (!isMarginRulesInfiniteData(cached)) {
          return cached;
        }

        const loadedItems = flattenItems(cached);
        const rowIndex = loadedItems.findIndex(
          (item) => item.id === previousRule.id
        );
        const matchedBefore = matchesMarginRulesQuery(
          previousRule,
          params,
          todayIsoDate
        );
        const matchedAfter = matchesMarginRulesQuery(
          nextRule,
          params,
          todayIsoDate
        );
        const totalCountDelta =
          matchedAfter === matchedBefore ? 0 : matchedAfter ? 1 : -1;
        const nextTotalCount = Math.max(
          0,
          (cached.pages[0]?.totalCount ?? loadedItems.length) + totalCountDelta
        );

        if (rowIndex === -1) {
          if (totalCountDelta === 0) {
            return cached;
          }

          return repaginateItems(cached, loadedItems, nextTotalCount);
        }

        const itemsWithoutRow = loadedItems.filter(
          (item) => item.id !== previousRule.id
        );
        const nextItems = matchedAfter
          ? [...itemsWithoutRow, nextRule].sort((left, right) =>
              compareMarginRules(
                left,
                right,
                params.sortBy,
                params.sortDirection
              )
            )
          : itemsWithoutRow;

        return repaginateItems(cached, nextItems, nextTotalCount);
      });
    });
}

export function deleteMarginRuleFromInfiniteCaches(
  queryClient: QueryClient,
  deletedRule: MarginRule,
  todayIsoDate: string = toLocalIsoDateString()
) {
  queryClient
    .getQueryCache()
    .findAll({ queryKey: [...MARGIN_RULES_QUERY_KEY] })
    .forEach(({ queryKey }) => {
      if (!isMarginRulesListQueryKey(queryKey)) {
        return;
      }

      const params = queryKey[1];

      if (!matchesMarginRulesQuery(deletedRule, params, todayIsoDate)) {
        return;
      }

      queryClient.setQueryData(queryKey, (cached) => {
        if (!isMarginRulesInfiniteData(cached)) {
          return cached;
        }

        const loadedItems = flattenItems(cached);
        const nextItems = loadedItems.filter(
          (item) => item.id !== deletedRule.id
        );
        const nextTotalCount = Math.max(
          0,
          (cached.pages[0]?.totalCount ?? loadedItems.length) - 1
        );

        return repaginateItems(cached, nextItems, nextTotalCount);
      });
    });
}
