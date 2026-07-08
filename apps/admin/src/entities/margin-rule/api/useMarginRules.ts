import { api, useInfiniteQuery, useQueryClient } from "@sol/api-client";
import { useCallback, useMemo } from "react";

import { getMarginRulesListQueryKey } from "../model/queryKeys";
import type {
  MarginRule,
  MarginRulesListApiResponse,
  MarginRulesListQueryInput,
} from "../model/types";

import { buildMarginRulesPath, normalizeMarginRulesResponse } from "./request";

export function useMarginRulesList(params: MarginRulesListQueryInput) {
  const queryClient = useQueryClient();
  const queryKey = getMarginRulesListQueryKey(params);
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const data = await api.get<MarginRulesListApiResponse | null>(
        buildMarginRulesPath(params, pageParam)
      );

      return normalizeMarginRulesResponse(data);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = useMemo<MarginRule[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const resetToFirstPage = useCallback(() => {
    return queryClient.resetQueries({
      queryKey,
      exact: true,
    });
  }, [queryClient, queryKey]);

  return {
    ...query,
    items,
    totalCount,
    resetToFirstPage,
  };
}
