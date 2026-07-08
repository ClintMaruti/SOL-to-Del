import { getErrorMessage } from "@sol/api-client";
import { Button } from "@sol/ui";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import type { MarginRule, MarginRuleSortBy } from "@/entities/margin-rule";
import { EmptySearchResult } from "@/shared/ui";

import { MarginRulesListEmpty } from "./MarginRulesListEmpty";
import { MarginRulesTableSkeleton } from "./MarginRulesTableSkeleton";
import { MarginRulesVirtualizedTable } from "./MarginRulesVirtualizedTable";

interface MarginRulesListContentProps {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  hasRows: boolean;
  hasSearchOrFilters: boolean;
  rows: MarginRule[];
  sortBy: MarginRuleSortBy;
  sortDirection: "asc" | "desc";
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onSort: (sortBy: MarginRuleSortBy) => void;
  onLoadMore: () => void;
  shouldResetToFirstPageOnBackToTop: boolean;
  onResetToFirstPage: () => void;
  onRetry: () => void;
  onCreateAction: (event: MouseEvent<HTMLButtonElement>) => void;
  onDuplicateRule: (rule: MarginRule) => void;
  onEditRule: (rule: MarginRule) => void;
  onDeleteRule: (rule: MarginRule) => void;
}

export function MarginRulesListContent({
  isLoading,
  isError,
  error,
  hasRows,
  hasSearchOrFilters,
  rows,
  sortBy,
  sortDirection,
  isFetchingNextPage,
  hasNextPage,
  onSort,
  onLoadMore,
  shouldResetToFirstPageOnBackToTop,
  onResetToFirstPage,
  onRetry,
  onCreateAction,
  onDuplicateRule,
  onEditRule,
  onDeleteRule,
}: MarginRulesListContentProps) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {isLoading ? <MarginRulesTableSkeleton /> : null}

      {isError ? (
        <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-b-md border-x border-b border-border-tertiary bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">
            {getErrorMessage(error, t("errors.failedToLoadMarginRules"))}
          </p>
          <Button
            type="button"
            variant="outline-secondary"
            className="mt-4"
            onClick={onRetry}
          >
            {t("common:buttons.tryAgain")}
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && !hasRows && !hasSearchOrFilters ? (
        <MarginRulesListEmpty
          onCreate={onCreateAction}
          className="rounded-b-md rounded-t-none border-x border-b border-t-0"
        />
      ) : null}

      {!isLoading && !isError && !hasRows && hasSearchOrFilters ? (
        <div className="rounded-b-md border-x border-b border-border-tertiary bg-white">
          <EmptySearchResult />
        </div>
      ) : null}

      {!isLoading && !isError && hasRows ? (
        <MarginRulesVirtualizedTable
          rows={rows}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
          shouldResetToFirstPageOnBackToTop={shouldResetToFirstPageOnBackToTop}
          onResetToFirstPage={onResetToFirstPage}
          onDuplicateRule={onDuplicateRule}
          onEditRule={onEditRule}
          onDeleteRule={onDeleteRule}
        />
      ) : null}
    </div>
  );
}
