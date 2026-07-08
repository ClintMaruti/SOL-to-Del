import { Table, TableBody, TableHead, TableHeader, TableRow } from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { Agency } from "@/entities/agency/model/types";
import { SortableHeader } from "@/shared/ui";
import { useAgencyListSort, type SortField } from "@/widgets/agency-list";

import { AgencyListTableRow } from "./AgencyListTableRow";

interface AgencyListTableProps {
  onAgencyClick?: (agency: Agency) => void;
  onRemove?: (agency: Agency) => void;
  onToggleStatus?: (agency: Agency, checked: boolean) => void;
  agencies: Agency[];
}

export function AgencyListTable({
  onAgencyClick,
  onRemove,
  onToggleStatus,
  agencies,
}: AgencyListTableProps) {
  const { t } = useTranslation("admin");
  const { sortState, toggleSort, sortedAgencies } = useAgencyListSort(agencies);
  return (
    <div>
      {sortedAgencies.length ? (
        <div className="border border-border rounded-md overflow-x-auto w-full">
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
                <TableHead className="w-[7%] border-r">
                  <SortableHeader<SortField>
                    label={t("tableHeaders.sm")}
                    field="sourceMarket"
                    currentField={sortState.field}
                    currentDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="w-[7%] border-r">
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
                  <AgencyListTableRow
                    key={agency.id}
                    agency={agency}
                    isEven={isEven !== 0}
                    onRemove={onRemove}
                    onToggleStatus={onToggleStatus}
                    onAgencyClick={onAgencyClick}
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
