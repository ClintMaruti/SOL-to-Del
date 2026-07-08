import { getErrorMessage } from "@sol/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { useAgents } from "@/entities/agent/api/useAgents";
import type { Agent } from "@/entities/agent/model/types";
import {
  CopyableCellGroup,
  EmptySearchResult,
  SearchInput,
  SortableHeader,
  TableLoadingSkeleton,
} from "@/shared/ui";

import type { SortField } from "../model/useAgentListSort";
import { useAgentListSort } from "../model/useAgentListSort";
import { useAgentSearch } from "../model/useAgentSearch";

import { AgentListEmpty } from "./AgentListEmpty";
import { AgentListRow } from "./AgentListRow";

interface AgentListProps {
  agencyId?: string | null;
  onDelete?: (agent: Agent) => void;
  onToggleStatus?: (agent: Agent) => void;
  onCreateAgent?: () => void;
}

export function AgentList({
  agencyId,
  onDelete,
  onToggleStatus,
  onCreateAgent,
}: AgentListProps) {
  const { t } = useTranslation("admin");
  const { data: agents = [], isLoading, error } = useAgents(agencyId);
  const { searchQuery, setSearchQuery, filteredAgents } =
    useAgentSearch(agents);
  const { sortState, toggleSort, sortedAgents } =
    useAgentListSort(filteredAgents);

  const canRender = !isLoading && !error;

  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("placeholders.searchAgent")}
      />
      {isLoading ? (
        <TableLoadingSkeleton
          columns={[
            "13.47",
            "13.55",
            "11.69",
            "16.23",
            "14.61",
            "16.23",
            "7.31",
            "6.90",
          ]}
          rows={10}
        />
      ) : null}
      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadAgents"))}
        </div>
      ) : null}
      {canRender && agents.length && searchQuery && !filteredAgents.length ? (
        <EmptySearchResult />
      ) : null}
      {canRender && !agents.length ? (
        <AgentListEmpty onCreateAgent={onCreateAgent} />
      ) : null}
      {canRender && agents.length && filteredAgents.length ? (
        <CopyableCellGroup>
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[13.47%] border-r pl-4 pr-2">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.agentName")}
                      field="firstName"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[13.55%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.agency")}
                      field="agencyName"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[11.69%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.agencyGroup")}
                      field="agencyGroup"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[16.23%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.email")}
                      field="primaryEmail"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[14.61%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.phone")}
                      field="phoneNumber"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[16.23%] border-r">
                    <SortableHeader<SortField>
                      label={t("tableHeaders.assignedSafariPlanner")}
                      field="assignedSafariPlannerName"
                      currentField={sortState.field}
                      currentDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[7.31%] border-r border-border text-right">
                    <SortableHeader<SortField>
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
                {sortedAgents.map((agent, index) => {
                  const isEven = index % 2;
                  return (
                    <AgentListRow
                      key={agent.id}
                      agent={agent}
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
        </CopyableCellGroup>
      ) : null}
    </div>
  );
}
