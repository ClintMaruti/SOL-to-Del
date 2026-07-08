import { getErrorMessage } from "@sol/api-client";
import { Alert, AlertDescription } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { useSupplierContentBlocks } from "@/entities/supplier-content-block";
import { TableLoadingSkeleton } from "@/shared/ui";

import { useSupplierContentListSort } from "../model/useSupplierContentListSort";

import { SupplierContentEmpty } from "./SupplierContentEmpty";
import { SupplierContentTable } from "./SupplierContentTable";

interface SupplierContentListProps {
  supplierId: string;
}

export function SupplierContentList({ supplierId }: SupplierContentListProps) {
  const { t } = useTranslation(["admin"]);
  const {
    data: rows = [],
    isLoading,
    error,
  } = useSupplierContentBlocks(supplierId);
  const { sortKey, sortDirection, onSort, sortedItems } =
    useSupplierContentListSort(rows);

  const canRender = !isLoading && !error;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4">
      {isLoading ? (
        <TableLoadingSkeleton columns={["26", "74"]} rows={8} />
      ) : null}
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {getErrorMessage(
              error,
              t("admin:errors.failedToLoadSupplierContentBlocks")
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {canRender && rows.length === 0 ? <SupplierContentEmpty /> : null}
      {canRender && rows.length > 0 ? (
        <SupplierContentTable
          supplierId={supplierId}
          rows={sortedItems}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ) : null}
    </div>
  );
}
