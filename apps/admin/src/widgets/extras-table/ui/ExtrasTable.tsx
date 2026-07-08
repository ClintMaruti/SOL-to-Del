import {
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sol/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import {
  useToggleExtraStatus,
  type CatalogExtra,
} from "@/entities/catalog-extra";
import {
  SORTABLE_TABLE_HEAD_BUTTON_CLASS,
  SortIcon,
} from "@/shared/components/Table";
import { supplierExtraDetailPath } from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import type {
  ExtrasSortField,
  ExtrasSortState,
  SortDirection,
} from "../model/useExtrasListSort";

const CELL_BORDER = "border-r border-b border-border-tertiary";

/** Figma: pl spacing/4 (16px) + pr spacing/2 (8px); sort `Button` uses `px-0` so inset matches spec. */
const HEAD_SORTABLE = "pl-4 pr-2 border-r border-gray-200 min-w-[85px]";
/** Last column: px-8px, label “Active”, sort icon, right-aligned. */
const HEAD_ACTIVE =
  "border-r border-gray-200 w-[95px] min-w-[85px] px-2 text-right";
const SORT_HEAD_BUTTON_ACTIVE = `${SORTABLE_TABLE_HEAD_BUTTON_CLASS} w-full justify-end`;

export interface ExtrasTableProps {
  variant: "supplier" | "service";
  extras: CatalogExtra[];
  sortState: ExtrasSortState;
  onSort: (field: ExtrasSortField, direction: SortDirection) => void;
  /** Required for Extras (title) links to extra detail. */
  supplierId?: string;
}

export function ExtrasTable({
  variant,
  extras,
  sortState,
  onSort,
  supplierId,
}: ExtrasTableProps) {
  const { t } = useTranslation("admin");
  const { mutate: toggleExtraStatus } = useToggleExtraStatus();
  const { extrasStatus } = useLoadingStates(
    useShallow((state) => ({ extrasStatus: state.extrasStatus }))
  );

  const toggleSort = (field: ExtrasSortField) => {
    if (sortState.field === field) {
      onSort(field, sortState.direction === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "asc");
    }
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-background-primary">
          <TableRow>
            <TableHead className={HEAD_SORTABLE}>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className={SORTABLE_TABLE_HEAD_BUTTON_CLASS}
                onClick={() => toggleSort("title")}
              >
                {t("tableHeaders.extras")}
                <SortIcon
                  columnKey="title"
                  sortKey={sortState.field}
                  sortDirection={sortState.direction}
                />
              </Button>
            </TableHead>
            <TableHead className={HEAD_SORTABLE}>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className={SORTABLE_TABLE_HEAD_BUTTON_CLASS}
                onClick={() => toggleSort("description")}
              >
                {t("tableHeaders.description")}
                <SortIcon
                  columnKey="description"
                  sortKey={sortState.field}
                  sortDirection={sortState.direction}
                />
              </Button>
            </TableHead>
            <TableHead className={HEAD_ACTIVE}>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className={SORT_HEAD_BUTTON_ACTIVE}
                onClick={() => toggleSort("isActive")}
              >
                {t("labels.active")}
                <SortIcon
                  columnKey="isActive"
                  sortKey={sortState.field}
                  sortDirection={sortState.direction}
                />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extras.map((row) => (
            <TableRow key={row.id} className="bg-background hover:bg-muted/50">
              <TableCell className={`pl-4 ${CELL_BORDER}`}>
                {supplierId ? (
                  <Link
                    to={{
                      pathname: supplierExtraDetailPath(supplierId, row.id),
                      search: variant === "service" ? "?context=service" : "",
                    }}
                    className="text-blue-500 hover:underline font-medium text-sm"
                  >
                    {row.title}
                  </Link>
                ) : (
                  <span className="text-blue-500 font-medium text-sm">
                    {row.title}
                  </span>
                )}
              </TableCell>
              <TableCell className={CELL_BORDER}>
                <span className="text-sm text-foreground">
                  {row.description?.trim()
                    ? row.description
                    : t("placeholders.dash")}
                </span>
              </TableCell>
              <TableCell
                className={`${CELL_BORDER} text-center pl-4 pr-2 py-2`}
              >
                <div className="flex min-h-9 items-center justify-end">
                  <Switch
                    checked={row.isActive}
                    onCheckedChange={(checked) =>
                      toggleExtraStatus({
                        extraId: row.id,
                        supplierId,
                        serviceId: row.serviceId,
                        activate: checked,
                      })
                    }
                    loading={extrasStatus[row.id]}
                    aria-label={t("aria.extraActiveStatus", {
                      title: row.title,
                    })}
                    size="sm"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
