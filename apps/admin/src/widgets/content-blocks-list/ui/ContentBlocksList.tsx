import { getErrorMessage } from "@sol/api-client";
import { useTranslation } from "react-i18next";

import { useContentBlocks } from "@/entities/content-block";
import { TableLoadingSkeleton } from "@/shared/ui";

import { useContentBlocksListSort } from "../model/useContentBlocksListSort";

import { ContentBlocksListEmpty } from "./ContentBlocksListEmpty";
import { ContentBlocksTable } from "./ContentBlocksTable";

interface ContentBlocksListProps {
  onCreateContentBlock?: () => void;
}

export function ContentBlocksList({
  onCreateContentBlock,
}: ContentBlocksListProps) {
  const { t } = useTranslation(["admin"]);
  const { data: contentBlocks = [], isLoading, error } = useContentBlocks();
  const { sortKey, sortDirection, onSort, sortedItems } =
    useContentBlocksListSort(contentBlocks);

  const canRender = !isLoading && !error;

  return (
    <div className="w-full min-w-0 space-y-4">
      {isLoading ? (
        <TableLoadingSkeleton columns={["18", "36", "46"]} rows={10} />
      ) : null}
      {error ? (
        <div className="text-destructive" role="alert">
          {getErrorMessage(error, t("admin:errors.failedToLoadContentBlocks"))}
        </div>
      ) : null}
      {canRender && !contentBlocks.length ? (
        <ContentBlocksListEmpty onCreateContentBlock={onCreateContentBlock} />
      ) : null}
      {canRender && contentBlocks.length ? (
        <ContentBlocksTable
          contentBlocks={sortedItems}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ) : null}
    </div>
  );
}
