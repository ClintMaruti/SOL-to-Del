import { getErrorMessage } from "@sol/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { useAgencies } from "@/entities/agency/api/useAgencies";
import type { Agency } from "@/entities/agency/model/types";
import {
  EmptySearchResult,
  SearchInput,
  SortableHeader,
  TableLoadingSkeleton,
} from "@/shared/ui";

import type { SortField } from "../model/useAgencyListSort";
import { useAgencyListSort } from "../model/useAgencyListSort";
import { useAgencySearch } from "../model/useAgencySearch";

import { AgencyListEmpty } from "./AgencyListEmpty";
import { AgencyListRow } from "./AgencyListRow";

interface AgencyListProps {
  agencyGroupId?: string | null;
  onCreateAgency?: () => void;
  onDelete?: (agency: Agency) => void;
  onToggleStatus?: (agency: Agency, checked: boolean) => void;
}

export function AgencyList({
  agencyGroupId,
  onCreateAgency,
  onDelete,
  onToggleStatus,
}: AgencyListProps) {
  const { t } = useTranslation("admin");
  const { data: agencies = [], isLoading, error } = useAgencies(agencyGroupId);
  const { searchQuery, setSearchQuery, filteredAgencies } =
    useAgencySearch(agencies);
  const { sortState, toggleSort, sortedAgencies } =
    useAgencyListSort(filteredAgencies);
  const canRender = !isLoading && !error;
  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("placeholders.searchAgency")}
      />
      {isLoading ? (
        <TableLoadingSkeleton
          columns={["26", "13", "16", "7", "24", "7", "7"]}
          rows={10}
        />
      ) : null}
      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadAgencies"))}
        </div>
      ) : null}
      {canRender &&
      agencies.length &&
      searchQuery &&
      !filteredAgencies.length ? (
        <EmptySearchResult />
      ) : null}
      {canRender && !agencies.length ? (
        <AgencyListEmpty onCreateAgency={onCreateAgency} />
      ) : null}
      {canRender && agencies.length && filteredAgencies.length ? (
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[26%] border-r pl-4 pr-2">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.agencyName")}
                    field="name"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="w-[13%] border-r">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.numberOfAgents")}
                    field="agentsCount"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="w-[16%] border-r">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.agencyGroup")}
                    field="agencyGroup"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="w-[7%] border-r">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.sm")}
                    field="sourceMarket"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="w-[24%] border-r">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.assignedSafariPlanner")}
                    field="assignedSafariPlannerName"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="w-[7%] border-r border-border text-right">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.status")}
                    field="status"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                    className="w-full justify-end"
                  />
                </TableHead>
                <TableHead className="w-[7%] text-right">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAgencies.map((agency, index) => {
                const isEven = index % 2;
                return (
                  <AgencyListRow
                    key={agency.id}
                    agency={agency}
                    isEven={isEven !== 0}
                    searchQuery={searchQuery}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
