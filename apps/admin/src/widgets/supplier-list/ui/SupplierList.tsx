import { getErrorMessage } from "@sol/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { useSuppliers } from "@/entities/suppliers/api/useSuppliers";
import type { Supplier } from "@/entities/suppliers/model/types";
import { useSupplierSearch } from "@/features/supplier-search";
import {
  CopyableCellGroup,
  EmptySearchResult,
  SearchInput,
  SortableHeader,
  TableLoadingSkeleton,
} from "@/shared/ui";

import type { SortField } from "../model/useSupplierListSort";
import { useSupplierListSort } from "../model/useSupplierListSort";

import { SupplierListEmpty } from "./SupplierListEmpty";
import { SupplierListRow } from "./SupplierListRow";

interface SupplierListProps {
  /** When set, loads suppliers for this head office only (URL: ?headOfficeId=). */
  headOfficeId?: string | null;
  onSupplierClick?: (supplier: Supplier) => void;
  onToggleStatus?: (supplier: Supplier, checked: boolean) => void;
  onDelete?: (supplier: Supplier) => void;
  onCreateSupplier?: () => void;
}

export function SupplierList({
  headOfficeId,
  onSupplierClick,
  onToggleStatus,
  onDelete,
  onCreateSupplier,
}: SupplierListProps) {
  const { t } = useTranslation("admin");
  const { data: suppliers = [], isLoading, error } = useSuppliers(headOfficeId);
  const { searchQuery, setSearchQuery, filteredSuppliers } =
    useSupplierSearch(suppliers);
  const { sortState, toggleSort, sortedSuppliers } =
    useSupplierListSort(filteredSuppliers);

  const canRender = !isLoading && !error;
  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("placeholders.searchSupplier")}
      />
      {isLoading ? (
        <TableLoadingSkeleton
          columns={["18", "16", "8", "14", "14", "12", "6", "6"]}
          rows={10}
        />
      ) : null}
      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadSuppliers"))}
        </div>
      ) : null}
      {canRender &&
      suppliers.length &&
      searchQuery &&
      !filteredSuppliers.length ? (
        <EmptySearchResult />
      ) : null}
      {canRender && !suppliers.length ? (
        <SupplierListEmpty onCreateSupplier={onCreateSupplier} />
      ) : null}
      {canRender && suppliers.length && filteredSuppliers.length ? (
        <CopyableCellGroup>
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[18%] border-r pl-4 pr-2">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.supplier")}
                      field="name"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[16%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.headOffice")}
                      field="headOfficeName"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[8%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.code")}
                      field="code"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[14%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.location")}
                      field="locationName"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[14%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.email")}
                      field="email"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[12%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.phone")}
                      field="phone"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[6%] border-r border-border text-right">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.status")}
                      field="isActive"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                      className="w-full justify-end"
                    />
                  </TableHead>
                  <TableHead className="w-[6%] text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSuppliers.map((supplier, index) => (
                  <SupplierListRow
                    key={supplier.id}
                    supplier={supplier}
                    isEven={index % 2 !== 0}
                    searchQuery={searchQuery}
                    onSupplierClick={onSupplierClick}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CopyableCellGroup>
      ) : null}
    </div>
  );
}
