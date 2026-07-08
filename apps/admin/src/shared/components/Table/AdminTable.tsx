import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SortableHeader } from "@/shared/ui";

import type { SortDirection } from "./SortIcon";

const DEFAULT_CELL_BORDER = "border-r border-b border-border-tertiary";

export interface AdminTableColumn<T> {
  /** Header label, or custom element when column is not sortable */
  header: string | ReactNode;
  headerClassName?: string;
  /** When set, column header becomes a sortable button (header must be string) */
  sortField?: string;
  /** Passed to `SortableHeader` (e.g. `w-full justify-end` for status columns) */
  sortableHeaderClassName?: string;
  cell: (data: T) => string | ReactNode;
  cellClassName?: string;
}

export interface AdminTableProps<T> {
  data: T[];
  columns: AdminTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  striped?: boolean;
  headerClassName?: string;
  /** Merged onto the inner `<table>` (e.g. `table-fixed` for column width ratios). */
  tableClassName?: string;
  /** When provided with sortField on columns, enables sortable headers */
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
}

export function AdminTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage,
  striped = true,
  headerClassName,
  tableClassName,
  sortKey = null,
  sortDirection = "asc",
  onSort,
}: AdminTableProps<T>) {
  const { t } = useTranslation("common");
  const effectiveEmptyMessage = emptyMessage ?? t("messages.noData");
  const handleSort = (key: string) => {
    if (!onSort) return;
    const nextDirection: SortDirection =
      sortKey === key && sortDirection === "asc" ? "desc" : "asc";
    onSort(key, nextDirection);
  };

  const renderHeader = (col: AdminTableColumn<T>) => {
    if (col.sortField != null && onSort && typeof col.header === "string") {
      return (
        <SortableHeader
          label={col.header}
          field={col.sortField}
          currentField={sortKey}
          currentDirection={sortDirection}
          onSort={handleSort}
          className={col.sortableHeaderClassName}
        />
      );
    }
    return col.header;
  };

  return (
    <div className="rounded-md border border-border-tertiary overflow-hidden">
      <Table className={tableClassName}>
        <TableHeader className={headerClassName ?? "bg-background-primary"}>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead
                key={i}
                className={cn(
                  "bg-background-primary text-text-secondary",
                  col.headerClassName,
                  i < columns.length - 1 && "border-r border-border-tertiary"
                )}
              >
                {renderHeader(col)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn(
                  DEFAULT_CELL_BORDER,
                  "h-24 text-center text-text-secondary"
                )}
              >
                {effectiveEmptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={getRowKey(row)}
                className={
                  striped
                    ? index % 2 === 0
                      ? "bg-background hover:bg-muted/50"
                      : "bg-background-primary hover:bg-muted/50"
                    : "bg-background hover:bg-muted/50"
                }
              >
                {columns.map((col, i) => (
                  <TableCell
                    key={i}
                    className={cn(DEFAULT_CELL_BORDER, col.cellClassName)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
