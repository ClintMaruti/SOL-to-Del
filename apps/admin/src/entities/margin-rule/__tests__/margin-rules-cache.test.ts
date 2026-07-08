import type { InfiniteData } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  deleteMarginRuleFromInfiniteCaches,
  getMarginRulesListQueryKey,
  insertMarginRuleIntoInfiniteCaches,
  updateMarginRuleInInfiniteCaches,
  type MarginRule,
  type MarginRulesListResponse,
} from "../index";

function createMarginRule(
  id: string,
  overrides?: Partial<MarginRule>
): MarginRule {
  return {
    id,
    agencyGroupId: "ag-1",
    agencyGroupName: "AAConsultants",
    serviceTypeNameId: null,
    serviceTypeName: null,
    supplierId: null,
    supplierName: null,
    serviceId: null,
    serviceName: null,
    optionId: null,
    optionName: null,
    validFrom: "2026-06-01",
    validTo: "2026-12-31",
    marginPercent: 12.5,
    version: 1,
    ...overrides,
  };
}

function createInfiniteData(
  pages: MarginRulesListResponse[]
): InfiniteData<MarginRulesListResponse, string | null> {
  return {
    pages,
    pageParams: pages.map((_, index) =>
      index === 0 ? null : `cursor-${index + 1}`
    ),
  };
}

describe("margin rule cache helpers", () => {
  it("inserts a matching created rule into the loaded window in sorted order", () => {
    const queryClient = new QueryClient();
    const queryKey = getMarginRulesListQueryKey({
      sortBy: "agencyGroupName",
      sortDirection: "asc",
      hideExpired: false,
    });

    queryClient.setQueryData(
      queryKey,
      createInfiniteData([
        {
          items: [
            createMarginRule("rule-2", { agencyGroupName: "Zulu Travel" }),
          ],
          nextCursor: null,
          totalCount: 1,
        },
      ])
    );

    insertMarginRuleIntoInfiniteCaches(
      queryClient,
      createMarginRule("rule-1", { agencyGroupName: "Alpha Travel" }),
      "2026-04-16"
    );

    const data =
      queryClient.getQueryData<
        InfiniteData<MarginRulesListResponse, string | null>
      >(queryKey);

    expect(data?.pages[0]?.items.map((item) => item.id)).toEqual([
      "rule-1",
      "rule-2",
    ]);
    expect(data?.pages[0]?.totalCount).toBe(2);
  });

  it("increments totalCount without inserting when the created rule falls beyond the loaded window", () => {
    const queryClient = new QueryClient();
    const queryKey = getMarginRulesListQueryKey({
      sortBy: "agencyGroupName",
      sortDirection: "asc",
      hideExpired: false,
    });

    queryClient.setQueryData(
      queryKey,
      createInfiniteData([
        {
          items: [
            createMarginRule("rule-1", { agencyGroupName: "Alpha Travel" }),
          ],
          nextCursor: "cursor-2",
          totalCount: 2,
        },
      ])
    );

    insertMarginRuleIntoInfiniteCaches(
      queryClient,
      createMarginRule("rule-3", { agencyGroupName: "Zulu Travel" }),
      "2026-04-16"
    );

    const data =
      queryClient.getQueryData<
        InfiniteData<MarginRulesListResponse, string | null>
      >(queryKey);

    expect(data?.pages[0]?.items.map((item) => item.id)).toEqual(["rule-1"]);
    expect(data?.pages[0]?.totalCount).toBe(3);
    expect(data?.pages[0]?.nextCursor).toBe("cursor-2");
  });

  it("removes an updated rule from cached variants it no longer matches", () => {
    const queryClient = new QueryClient();
    const previousRule = createMarginRule("rule-1", {
      supplierId: "sup-1",
      supplierName: "Elewana Lodges & Camps",
    });
    const nextRule = createMarginRule("rule-1", {
      supplierId: "sup-2",
      supplierName: "Serengeti Safari Co.",
    });
    const queryKey = getMarginRulesListQueryKey({
      supplierId: "sup-1",
      sortBy: "agencyGroupName",
      sortDirection: "asc",
      hideExpired: false,
    });

    queryClient.setQueryData(
      queryKey,
      createInfiniteData([
        {
          items: [previousRule],
          nextCursor: null,
          totalCount: 1,
        },
      ])
    );

    updateMarginRuleInInfiniteCaches(
      queryClient,
      previousRule,
      nextRule,
      "2026-04-16"
    );

    const data =
      queryClient.getQueryData<
        InfiniteData<MarginRulesListResponse, string | null>
      >(queryKey);

    expect(data?.pages[0]?.items).toEqual([]);
    expect(data?.pages[0]?.totalCount).toBe(0);
  });

  it("deletes a loaded rule and decrements totalCount without touching nextCursor", () => {
    const queryClient = new QueryClient();
    const deletedRule = createMarginRule("rule-1");
    const queryKey = getMarginRulesListQueryKey({
      sortBy: "agencyGroupName",
      sortDirection: "asc",
      hideExpired: false,
    });

    queryClient.setQueryData(
      queryKey,
      createInfiniteData([
        {
          items: [deletedRule],
          nextCursor: "cursor-2",
          totalCount: 2,
        },
      ])
    );

    deleteMarginRuleFromInfiniteCaches(queryClient, deletedRule, "2026-04-16");

    const data =
      queryClient.getQueryData<
        InfiniteData<MarginRulesListResponse, string | null>
      >(queryKey);

    expect(data?.pages[0]?.items).toEqual([]);
    expect(data?.pages[0]?.totalCount).toBe(1);
    expect(data?.pages[0]?.nextCursor).toBe("cursor-2");
  });
});
