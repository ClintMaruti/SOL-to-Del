import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "@sol/ui";
import type { TFunction } from "i18next";
import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { AgencyGroup } from "@/entities/agency-group/model/types";
import {
  AdminTable,
  type AdminTableColumn,
} from "@/shared/components/Table/AdminTable";
import type { SortDirection } from "@/shared/components/Table/SortIcon";
import { useHighlightMatch } from "@/shared/hooks";
import { agencyGroupDetailPath, ROUTES } from "@/shared/lib/paths";

import type { SortKey } from "../model/useAgencyGroupsListSort";

function HighlightedText({ text, query }: { text: string; query?: string }) {
  const highlighted = useHighlightMatch(text, query);
  return <span className="font-medium">{highlighted}</span>;
}

function formatAgencyCount(count: number, t: TFunction): string {
  return count === 1
    ? t("tableHeaders.agencyCountFormat", { count: 1 })
    : t("tableHeaders.agenciesCountFormat", { count });
}

interface AgencyGroupsTableProps {
  agencyGroups: AgencyGroup[];
  searchQuery?: string;
  sortKey?: SortKey;
  sortDirection?: SortDirection;
  onSort?: (key: SortKey | null, direction: SortDirection) => void;
  onToggleActive?: (group: AgencyGroup, active: boolean) => void;
  onDelete?: (group: AgencyGroup) => void;
}

export function AgencyGroupsTable({
  agencyGroups,
  searchQuery,
  sortKey = null,
  sortDirection = "asc",
  onSort,
  onToggleActive,
  onDelete,
}: AgencyGroupsTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(["admin", "common"]);

  const handleGroupNameClick = (group: AgencyGroup) => {
    navigate(agencyGroupDetailPath(group.id));
  };
  const columns: AdminTableColumn<AgencyGroup>[] = [
    {
      header: t("tableHeaders.groupName"),
      sortField: "name",
      headerClassName: "px-4",
      sortableHeaderClassName: "font-medium",
      cell: (group) => (
        <Button
          variant="link"
          className="h-auto p-0 text-link hover:text-link/90 font-medium"
          onClick={() => handleGroupNameClick(group)}
        >
          <HighlightedText text={group.name} query={searchQuery} />
        </Button>
      ),
      cellClassName: "px-4",
    },
    {
      header: t("tableHeaders.numberOfAgencies"),
      sortField: "agencyCount",
      sortableHeaderClassName: "font-medium",
      cell: (group) =>
        group.numberOfAgencies > 0 ? (
          <Button
            variant="link"
            className="h-auto p-0 text-link font-medium hover:text-link/90"
            onClick={() =>
              navigate(
                `${ROUTES.AGENCIES}?search=${encodeURIComponent(group.name)}`
              )
            }
          >
            {formatAgencyCount(group.numberOfAgencies, t)}
          </Button>
        ) : (
          <span className="text-sm font-medium text-text-secondary">
            {formatAgencyCount(group.numberOfAgencies, t)}
          </span>
        ),
    },
    {
      header: t("tableHeaders.description"),
      sortableHeaderClassName: "font-medium",
      cell: (group) =>
        group.description ? (
          <HighlightedText text={group.description} query={searchQuery} />
        ) : (
          t("placeholders.dash")
        ),
    },
    {
      header: t("tableHeaders.status"),
      headerClassName: "w-[90px] text-right",
      sortField: "isActive",
      sortableHeaderClassName: "w-full justify-end font-medium",
      cell: (group) => (
        <div className="flex min-h-9 items-center justify-end">
          <Switch
            checked={group.isActive}
            onCheckedChange={(checked) => onToggleActive?.(group, checked)}
          />
        </div>
      ),
      cellClassName: "text-end",
    },
    {
      header: "Actions",
      headerClassName: "w-[70px] text-right font-medium",
      sortableHeaderClassName: "font-medium",
      cell: (group) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4 text-text-tertiary" />
              <span className="sr-only">{t("table.actions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(group)}
                className="text-destructive focus:text-destructive"
              >
                {t("common:buttons.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cellClassName: "text-end",
    },
  ];

  return (
    <AdminTable<AgencyGroup>
      data={agencyGroups}
      columns={columns}
      getRowKey={(row) => row.id}
      emptyMessage={t("empty.noAgencyGroupsFound")}
      striped
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={
        onSort
          ? (key, direction) => onSort(key as SortKey, direction)
          : undefined
      }
    />
  );
}
