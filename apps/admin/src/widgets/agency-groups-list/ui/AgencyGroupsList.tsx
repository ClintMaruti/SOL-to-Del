import { getErrorMessage } from "@sol/api-client";
import { useTranslation } from "react-i18next";

import { useAgencyGroups } from "@/entities/agency-group";
import type { AgencyGroup } from "@/entities/agency-group/model/types";
import { useAgencyGroupSearch } from "@/features/agency-group-search";
import {
  EmptySearchResult,
  SearchInput,
  TableLoadingSkeleton,
} from "@/shared/ui";

import { useAgencyGroupsListSort } from "../model/useAgencyGroupsListSort";

import { AgencyGroupsListEmpty } from "./AgencyGroupsListEmpty";
import { AgencyGroupsTable } from "./AgencyGroupsTable";

interface AgencyGroupsListProps {
  onToggleActive?: (group: AgencyGroup, active: boolean) => void;
  onDelete?: (group: AgencyGroup) => void;
  onCreateAgencyGroup?: () => void;
}

export function AgencyGroupsList({
  onToggleActive,
  onDelete,
  onCreateAgencyGroup,
}: AgencyGroupsListProps) {
  const { t } = useTranslation("admin");
  const { data: agencyGroups = [], isLoading, error } = useAgencyGroups();
  const { searchQuery, setSearchQuery, filteredAgencyGroups } =
    useAgencyGroupSearch(agencyGroups);
  const { sortKey, sortDirection, onSort, sortedAgencyGroups } =
    useAgencyGroupsListSort(filteredAgencyGroups);

  const canRender = !isLoading && !error;

  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("placeholders.searchAgencyGroup")}
      />
      {isLoading ? (
        <TableLoadingSkeleton
          columns={["25", "20", "35", "10", "10"]}
          rows={10}
        />
      ) : null}
      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadAgencyGroups"))}
        </div>
      ) : null}
      {canRender &&
      agencyGroups.length &&
      searchQuery &&
      !filteredAgencyGroups.length ? (
        <EmptySearchResult />
      ) : null}
      {canRender && !agencyGroups.length ? (
        <AgencyGroupsListEmpty onCreateAgencyGroup={onCreateAgencyGroup} />
      ) : null}
      {canRender && agencyGroups.length && filteredAgencyGroups.length ? (
        <AgencyGroupsTable
          agencyGroups={sortedAgencyGroups}
          searchQuery={searchQuery}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  );
}
