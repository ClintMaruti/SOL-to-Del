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

import type { DocumentTemplateListItem } from "@/entities/document-template";
import type { SortDirection } from "@/shared/components/Table";
import { documentTemplateDetailPath } from "@/shared/lib/paths";
import { SortableHeader } from "@/shared/ui";

import type { DocumentTemplatesSortKey } from "../model/useDocumentTemplatesListSort";

const VISIBLE_BLOCK_BADGES = 6;

const badgeClass =
  "h-[22px] rounded-sm border-0 bg-background-secondary px-2 py-0 text-[12px] font-medium leading-[14px] text-text-primary shadow-none hover:bg-background-secondary";

interface DocumentTemplatesTableProps {
  documentTemplates: DocumentTemplateListItem[];
  sortKey?: DocumentTemplatesSortKey;
  sortDirection?: SortDirection;
  onSort?: (key: Exclude<DocumentTemplatesSortKey, null>) => void;
}

export function DocumentTemplatesTable({
  documentTemplates,
  sortKey = null,
  sortDirection = "asc",
  onSort,
}: DocumentTemplatesTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  return (
    <div className="overflow-hidden rounded-md border border-border-tertiary bg-background">
      <Table>
        <TableHeader className="bg-background-secondary [&_tr]:border-border-tertiary">
          <TableRow className="hover:bg-background-secondary">
            <TableHead className="h-10 m-w-[220px] border-r border-gray-300 px-4 py-2 text-sm">
              <SortableHeader<Exclude<DocumentTemplatesSortKey, null>>
                label={t("documentTemplates.table.title")}
                field="title"
                currentField={sortKey}
                currentDirection={sortDirection}
                onSort={(field) => onSort?.(field)}
              />
            </TableHead>
            <TableHead className="h-10 px-4 py-2 text-sm font-semibold text-neutral-900">
              {t("documentTemplates.table.contentBlocks")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentTemplates.length ? (
            documentTemplates.map((row) => {
              const visibleBlocks = row.blocks.slice(0, VISIBLE_BLOCK_BADGES);
              const hiddenBlocks = row.blocks.length - visibleBlocks.length;

              return (
                <TableRow
                  key={row.id}
                  className="bg-background hover:bg-background"
                >
                  <TableCell className="h-10 border-r border-border-tertiary px-4 py-2 align-middle">
                    <Button
                      variant="link"
                      className="h-auto px-0 py-0 text-[14px] font-medium leading-6 text-link hover:text-link/90"
                      onClick={() =>
                        navigate(documentTemplateDetailPath(row.id))
                      }
                    >
                      {row.title}
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-middle">
                    {row.blocks.length ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {visibleBlocks.map((block) => (
                          <Badge
                            key={`${row.id}-${block}`}
                            variant="secondary"
                            className={badgeClass}
                          >
                            {block}
                          </Badge>
                        ))}
                        {hiddenBlocks > 0 ? (
                          <Badge variant="secondary" className={badgeClass}>
                            +{hiddenBlocks}
                          </Badge>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-sm text-text-secondary">
                        {t("placeholders.dash")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow className="bg-background hover:bg-background">
              <TableCell
                colSpan={2}
                className={cn(
                  "px-4 py-8 text-center text-sm text-text-secondary"
                )}
              >
                {t("documentTemplates.table.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
