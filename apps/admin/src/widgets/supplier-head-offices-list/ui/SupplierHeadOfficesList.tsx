import { getErrorMessage } from "@sol/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { useSupplierHeadOffices } from "@/entities/supplier-head-office/api/useSupplierHeadOffices";
import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";
import { useSupplierHeadOfficeSearch } from "@/features/supplier-head-office-search/model/useSupplierHeadOfficeSearch";
import {
  CopyableCellGroup,
  EmptySearchResult,
  SearchInput,
  SortableHeader,
  TableLoadingSkeleton,
} from "@/shared/ui";

import {
  useSupplierHeadOfficesListSort,
  type SupplierHeadOfficesListSortField,
} from "../model/useSupplierHeadOfficesListSort";

import { SupplierHeadOfficesListEmpty } from "./SupplierHeadOfficesListEmpty";
import { SupplierHeadOfficesListRow } from "./SupplierHeadOfficesListRow";

interface SupplierHeadOfficesListProps {
  onDelete?: (supplierHeadOffice: SupplierHeadOffice) => void;
  onToggleStatus?: (
    supplierHeadOffice: SupplierHeadOffice,
    isActive: boolean
  ) => void;
  onCreateSupplierHeadOffice?: () => void;
  onDuplicateSupplierHeadOffice?: (
    supplierHeadOffice: SupplierHeadOffice
  ) => void;
}

export function SupplierHeadOfficesList({
  onDelete,
  onToggleStatus,
  onCreateSupplierHeadOffice,
  onDuplicateSupplierHeadOffice,
}: SupplierHeadOfficesListProps) {
  const { t } = useTranslation("admin");
  const {
    data: supplierHeadOffices = [],
    isLoading,
    error,
  } = useSupplierHeadOffices();

  const { searchQuery, setSearchQuery, filteredSupplierHeadOffices } =
    useSupplierHeadOfficeSearch(supplierHeadOffices);

  const { sortState, toggleSort, sortedSupplierHeadOffices } =
    useSupplierHeadOfficesListSort(filteredSupplierHeadOffices);

  const canRender = !isLoading && !error;

  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("placeholders.searchHeadOffice")}
      />
      {isLoading ? (
        <TableLoadingSkeleton
          columns={["27.35", "14.61", "25.97", "17.86", "7.31", "6.90"]}
        />
      ) : null}
      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadHeadOffices"))}
        </div>
      ) : null}
      {canRender &&
      supplierHeadOffices.length &&
      searchQuery &&
      !filteredSupplierHeadOffices.length ? (
        <EmptySearchResult />
      ) : null}
      {canRender && !supplierHeadOffices.length ? (
        <SupplierHeadOfficesListEmpty
          onCreateSupplierHeadOffice={onCreateSupplierHeadOffice}
        />
      ) : null}
      {canRender &&
      supplierHeadOffices.length &&
      filteredSupplierHeadOffices.length ? (
        <CopyableCellGroup>
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[27.35%] border-r pl-4 pr-2">
                    <SortableHeader<SupplierHeadOfficesListSortField>
                      label={t("tableHeaders.headOfficeName")}
                      field="name"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[14.61%] border-r">
                    <SortableHeader<SupplierHeadOfficesListSortField>
                      label={t("tableHeaders.suppliersCount")}
                      field="suppliersCount"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[25.97%] border-r">
                    <SortableHeader<SupplierHeadOfficesListSortField>
                      label={t("tableHeaders.email")}
                      field="email"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[17.86%] border-r">
                    <SortableHeader<SupplierHeadOfficesListSortField>
                      label={t("tableHeaders.phone")}
                      field="phoneNumber"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[7.31%] border-r border-border text-right">
                    <SortableHeader<SupplierHeadOfficesListSortField>
                      label={t("tableHeaders.status")}
                      field="isActive"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                      className="w-full justify-end"
                    />
                  </TableHead>
                  <TableHead className="w-[6.90%] text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSupplierHeadOffices.map((supplierHeadOffice, index) => {
                  const isEven = index % 2;
                  return (
                    <SupplierHeadOfficesListRow
                      key={supplierHeadOffice.id}
                      supplierHeadOffice={supplierHeadOffice}
                      isEven={isEven !== 0}
                      searchQuery={searchQuery}
                      onDelete={onDelete}
                      onToggleStatus={onToggleStatus}
                      onDuplicate={onDuplicateSupplierHeadOffice}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CopyableCellGroup>
      ) : null}
    </div>
  );
}
