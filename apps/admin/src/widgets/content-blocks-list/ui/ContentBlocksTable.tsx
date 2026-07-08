import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { ContentBlockListItem } from "@/entities/content-block/model/types";
import type { SortDirection } from "@/shared/components/Table/SortIcon";
import { SortableHeader } from "@/shared/ui";
import { contentBlockDetailPath } from "@/shared/lib/paths";

import { htmlToPlainTextPreview } from "../lib/htmlToPlainTextPreview";
import type { ContentBlocksSortKey } from "../model/useContentBlocksListSort";

const VISIBLE_TEMPLATE_BADGES = 3;

const templateBadgeClass =
  "border-0 bg-[#E5E7EB] font-normal text-text-primary shadow-none hover:bg-[#E5E7EB]";

const DEFAULT_CELL_BORDER = "border-r border-b border-border-tertiary";

interface ContentBlocksTableProps {
  contentBlocks: ContentBlockListItem[];
  sortKey?: ContentBlocksSortKey;
  sortDirection?: SortDirection;
  onSort?: (key: ContentBlocksSortKey | null, direction: SortDirection) => void;
}

export function ContentBlocksTable({
  contentBlocks,
  sortKey = null,
  sortDirection = "asc",
  onSort,
}: ContentBlocksTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(["admin", "common"]);

  const handleHeaderSort = (field: "title" | "body") => {
    if (!onSort) {
      return;
    }
    const nextDirection: SortDirection =
      sortKey === field && sortDirection === "asc" ? "desc" : "asc";
    onSort(field, nextDirection);
  };

  const emptyMessage = t("admin:contentBlocks.table.empty");

  return (
    <div className="w-full min-w-0 rounded-md border border-border overflow-hidden">
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "52%" }} />
        </colgroup>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead
              className={cn(
                "min-w-0 border-r border-gray-300 bg-gray-200 px-4 text-left text-neutral-900"
              )}
            >
              {onSort ? (
                <SortableHeader
                  label={t("admin:contentBlocks.table.title")}
                  field="title"
                  currentField={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleHeaderSort}
                  className="w-full min-w-0 justify-start"
                />
              ) : (
                t("admin:contentBlocks.table.title")
              )}
            </TableHead>
            <TableHead
              className={cn(
                "min-w-0 border-r border-gray-300 bg-gray-200 px-4 text-left text-sm font-medium text-neutral-900"
              )}
            >
              {t("admin:contentBlocks.table.applicableTemplates")}
            </TableHead>
            <TableHead
              className={cn(
                "min-w-0 bg-gray-200 px-4 text-left text-neutral-900"
              )}
            >
              {onSort ? (
                <SortableHeader
                  label={t("admin:contentBlocks.table.textPreview")}
                  field="body"
                  currentField={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleHeaderSort}
                  className="w-full min-w-0 justify-start"
                />
              ) : (
                t("admin:contentBlocks.table.textPreview")
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentBlocks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className={cn(
                  DEFAULT_CELL_BORDER,
                  "h-24 text-center text-text-secondary"
                )}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            contentBlocks.map((row) => (
              <TableRow
                key={row.id}
                className="border-b bg-background transition-colors hover:bg-muted/50"
              >
                <TableCell
                  className={cn(
                    DEFAULT_CELL_BORDER,
                    "min-w-0 max-w-0 overflow-hidden px-4 align-top"
                  )}
                >
                  <Button
                    variant="link"
                    className="h-auto block min-w-0 max-w-full truncate p-0 text-left font-normal text-link hover:text-link/90"
                    onClick={() => navigate(contentBlockDetailPath(row.id))}
                  >
                    {row.title}
                  </Button>
                </TableCell>
                <TableCell
                  className={cn(
                    DEFAULT_CELL_BORDER,
                    "min-w-0 px-4 align-top whitespace-normal"
                  )}
                >
                  {(() => {
                    const types = row.applicableDocumentTypes;
                    if (!types.length) {
                      return (
                        <span className="text-sm text-text-secondary">
                          {t("admin:placeholders.dash")}
                        </span>
                      );
                    }
                    const visible = types.slice(0, VISIBLE_TEMPLATE_BADGES);
                    const rest = types.length - visible.length;
                    return (
                      <div className="flex flex-wrap items-center gap-1">
                        {visible.map((name) => (
                          <Badge
                            key={name}
                            variant="secondary"
                            className={templateBadgeClass}
                          >
                            {name}
                          </Badge>
                        ))}
                        {rest > 0 ? (
                          <Badge
                            variant="secondary"
                            className={templateBadgeClass}
                          >
                            +{rest}
                          </Badge>
                        ) : null}
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell
                  className={cn(
                    DEFAULT_CELL_BORDER,
                    "min-w-0 max-w-0 overflow-hidden px-4 align-top"
                  )}
                >
                  {(() => {
                    const plain = htmlToPlainTextPreview(row.body);
                    return (
                      <div
                        className="m-0 block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium text-text-secondary"
                        title={plain !== "" ? plain : undefined}
                      >
                        {plain !== "" ? plain : t("admin:placeholders.dash")}
                      </div>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
