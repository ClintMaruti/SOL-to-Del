import { useInfiniteQuery, useQueryClient } from "@sol/api-client";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMarginRulesList } from "../api/useMarginRules";
import {
  buildMarginRulesPath,
  normalizeMarginRulesResponse,
} from "../api/request";
import { MARGIN_RULES_PAGE_SIZE, type MarginRule } from "../model/types";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();

  return {
    ...actual,
    api: {
      get: vi.fn(),
    },
    useInfiniteQuery: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
const mockUseQueryClient = vi.mocked(useQueryClient);

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
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    marginPercent: 12.5,
    version: 1,
    ...overrides,
  };
}

describe("margin rule api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      resetQueries: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useQueryClient>);
  });

  it("builds the expected list path with defaults, filters, and cursor", () => {
    const path = buildMarginRulesPath(
      {
        sortBy: "supplierName",
        sortDirection: "desc",
        search: "  Hilton  ",
        agencyGroupId: "ag-1",
        serviceTypeId: "st-1",
        supplierId: "sup-1",
        serviceId: "service-1",
        optionId: "option-1",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        marginPercent: "12.5",
        hideExpired: false,
      },
      "next-cursor"
    );

    expect(path).toBe(
      `/catalog/margin-rules?cursor=next-cursor&pageSize=${MARGIN_RULES_PAGE_SIZE}&sortBy=supplierName&sortDirection=desc&search=Hilton&agencyGroupId=ag-1&serviceTypeId=st-1&supplierId=sup-1&serviceId=service-1&optionId=option-1&validFrom=2026-01-01&validTo=2026-12-31&marginPercent=12.5&hideExpired=false&includeTotalCount=true`
    );
  });

  it("normalizes empty or malformed responses safely", () => {
    expect(normalizeMarginRulesResponse(undefined)).toEqual({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });

    expect(
      normalizeMarginRulesResponse({
        items: undefined as unknown as MarginRule[],
        nextCursor: 42 as unknown as string,
        totalCount: "bad" as unknown as number,
      })
    ).toEqual({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });
  });

  it("normalizes backend cursor to the internal nextCursor field", () => {
    expect(
      normalizeMarginRulesResponse({
        items: [createMarginRule("rule-1"), createMarginRule("rule-2")],
        cursor: "backend-cursor",
      })
    ).toEqual({
      items: [createMarginRule("rule-1"), createMarginRule("rule-2")],
      nextCursor: "backend-cursor",
      totalCount: 2,
    });
  });

  it("flattens paginated results and exposes the first page total count", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            items: [createMarginRule("rule-1"), createMarginRule("rule-2")],
            nextCursor: "cursor-2",
            totalCount: 3,
          },
          {
            items: [createMarginRule("rule-3")],
            nextCursor: null,
            totalCount: 3,
          },
        ],
      },
      hasNextPage: true,
      isLoading: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useInfiniteQuery>);

    const { result } = renderHook(() =>
      useMarginRulesList({
        search: "Hil",
        sortBy: "agencyGroupName",
        sortDirection: "asc",
        hideExpired: true,
      })
    );

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        initialPageParam: null,
        queryKey: [
          "margin-rules",
          {
            search: "Hil",
            sortBy: "agencyGroupName",
            sortDirection: "asc",
            hideExpired: true,
          },
        ],
        getNextPageParam: expect.any(Function),
      })
    );
    expect(result.current.items.map((item) => item.id)).toEqual([
      "rule-1",
      "rule-2",
      "rule-3",
    ]);
    expect(result.current.totalCount).toBe(3);
  });

  it("resets the active infinite query back to page one", async () => {
    const resetQueries = vi.fn().mockResolvedValue(undefined);
    mockUseQueryClient.mockReturnValue({
      resetQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [],
      },
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useInfiniteQuery>);

    const { result } = renderHook(() =>
      useMarginRulesList({
        search: "Hil",
        sortBy: "agencyGroupName",
        sortDirection: "asc",
        hideExpired: true,
      })
    );

    await act(async () => {
      await result.current.resetToFirstPage();
    });

    expect(resetQueries).toHaveBeenCalledWith({
      queryKey: [
        "margin-rules",
        {
          search: "Hil",
          sortBy: "agencyGroupName",
          sortDirection: "asc",
          hideExpired: true,
        },
      ],
      exact: true,
    });
  });
});
