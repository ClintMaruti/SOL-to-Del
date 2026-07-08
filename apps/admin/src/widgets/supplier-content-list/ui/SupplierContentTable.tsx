import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { SupplierContentBlockListItem } from "@/entities/supplier-content-block";
import {
  AdminTable,
  type AdminTableColumn,
} from "@/shared/components/Table/AdminTable";
import type { SortDirection } from "@/shared/components/Table/SortIcon";
import { supplierContentBlockDetailPath } from "@/shared/lib/paths";

import { htmlToPlainTextPreview } from "../lib/htmlToPlainTextPreview";
import type { SupplierContentSortKey } from "../model/useSupplierContentListSort";

interface SupplierContentTableProps {
  supplierId: string;
  rows: SupplierContentBlockListItem[];
  sortKey?: SupplierContentSortKey;
  sortDirection?: SortDirection;
  onSort?: (
    key: SupplierContentSortKey | null,
    direction: SortDirection
  ) => void;
}

export function SupplierContentTable({
  supplierId,
  rows,
  sortKey = null,
  sortDirection = "asc",
  onSort,
}: SupplierContentTableProps) {
  const { t } = useTranslation(["admin", "common"]);

  const columns: AdminTableColumn<SupplierContentBlockListItem>[] = [
    {
      header: t("admin:supplierContent.table.title"),
      sortField: "title",
      headerClassName: "px-4 w-[26%] min-w-0 max-w-0 align-middle",
      sortableHeaderClassName: "w-full min-w-0 justify-start",
      cell: (row) => (
        <Link
          className="block min-w-0 max-w-full truncate text-left text-sm font-medium text-link underline-offset-4 hover:text-link/90 hover:underline"
          to={supplierContentBlockDetailPath(supplierId, row.id)}
        >
          {row.title}
        </Link>
      ),
      cellClassName:
        "px-4 w-[26%] min-w-0 max-w-0 overflow-hidden whitespace-normal align-top",
    },
    {
      header: t("admin:supplierContent.table.text"),
      sortField: "bodyPreview",
      headerClassName: "px-4 w-[74%] min-w-0 align-middle",
      sortableHeaderClassName: "w-full min-w-0 justify-start",
      cell: (row) => {
        const plain = htmlToPlainTextPreview(row.bodyPreview);
        const display =
          plain.length > 0 ? plain : t("admin:supplierContent.table.emptyCell");
        return (
          <span
            className="block min-w-0 max-w-full truncate text-sm font-medium text-text-secondary"
            title={plain || undefined}
          >
            {display}
          </span>
        );
      },
      cellClassName:
        "px-4 w-[74%] min-w-0 overflow-hidden whitespace-normal align-top",
    },
  ];

  return (
    <AdminTable<SupplierContentBlockListItem>
      data={rows}
      columns={columns}
      getRowKey={(row) => row.id}
      emptyMessage={t("admin:supplierContent.table.empty")}
      striped={false}
      tableClassName="table-fixed"
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={
        onSort
          ? (key, direction) =>
              onSort(key as SupplierContentSortKey | null, direction)
          : undefined
      }
    />
  );
}
