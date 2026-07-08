import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "@sol/ui";
import { CopyIcon, MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Agent } from "@/entities/agent/model/types";
import {
  AdminTable,
  type AdminTableColumn,
  type SortDirection,
} from "@/shared/components/Table";
import { copyToClipboard } from "@/shared/lib";

interface AgentsTableProps {
  agents: Agent[];
  emptyMessage?: string;
  /** When set, agent name is a button that navigates to the agent (e.g. view/update mode) */
  onAgentNameClick?: (agent: Agent) => void;
  onToggleActive?: (agent: Agent, checked: boolean) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
}

function getAgentSortValue(
  agent: Agent,
  key: string
): string | number | boolean {
  switch (key) {
    case "name":
      return `${agent.firstName ?? ""} ${agent.lastName ?? ""}`
        .trim()
        .toLowerCase();
    case "email":
      return (agent.primaryEmail ?? "").toLowerCase();
    case "active":
      return agent.isActive ? 1 : 0;
    default:
      return "";
  }
}

export function AgentsTable({
  agents,
  emptyMessage,
  onAgentNameClick,
  onToggleActive,
  onEdit,
  onDelete,
}: AgentsTableProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [sortKey, setSortKey] = useState<string | null>("");
  const effectiveEmptyMessage =
    emptyMessage ?? t("admin:empty.noAgentsInAgency");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedAgents = useMemo(() => {
    if (!sortKey) return agents;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...agents].sort((a, b) => {
      const va = getAgentSortValue(a, sortKey);
      const vb = getAgentSortValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string")
        return dir * va.localeCompare(vb);
      if (typeof va === "number" && typeof vb === "number")
        return dir * (va - vb);
      if (typeof va === "boolean" && typeof vb === "boolean")
        return dir * (Number(va) - Number(vb));
      return 0;
    });
  }, [agents, sortKey, sortDirection]);

  const columns: AdminTableColumn<Agent>[] = [
    {
      header: t("admin:tableHeaders.agentName"),
      sortField: "name",
      headerClassName: "px-4",
      cell: (agent) => (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-link font-normal hover:text-link/90"
          onClick={() => onAgentNameClick?.(agent)}
        >
          {agent.firstName?.concat(" ", agent.lastName ?? "").trim() ||
            t("admin:placeholders.dash")}
        </Button>
      ),
      cellClassName: "px-4",
    },
    {
      header: t("admin:tableHeaders.email"),
      sortField: "email",
      cell: (agent) => (
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start gap-1.5 p-0 text-left text-sm font-medium text-link hover:text-link/90"
          onClick={() =>
            copyToClipboard(
              agent.primaryEmail ?? "",
              t("common:messages.copied")
            )
          }
          aria-label={t("admin:aria.copyEmail")}
        >
          <CopyIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate text-text-secondary">
            {agent.primaryEmail ?? t("admin:placeholders.dash")}
          </span>
        </Button>
      ),
    },
    {
      header: t("admin:tableHeaders.phone"),
      cell: (agent) => (
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start gap-1.5 p-0 text-left text-sm font-medium text-link hover:text-link/90"
          onClick={() =>
            copyToClipboard(
              agent.phoneNumber ?? "",
              t("common:messages.copied")
            )
          }
          aria-label={t("admin:aria.copyPhone")}
        >
          <CopyIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate text-text-secondary">
            {agent.phoneNumber ?? t("admin:placeholders.dash")}
          </span>
        </Button>
      ),
    },
    {
      header: t("admin:tableHeaders.status"),
      headerClassName: "w-[90px] text-right",
      sortField: "active",
      sortableHeaderClassName: "w-full justify-end",
      cell: (agent) => (
        <div className="flex min-h-9 items-center justify-end">
          <Switch
            checked={agent.isActive}
            onCheckedChange={(checked: boolean) =>
              onToggleActive?.(agent, checked)
            }
            disabled={!onToggleActive}
          />
        </div>
      ),
      cellClassName: "text-end",
    },
    {
      header: t("admin:table.actions"),
      headerClassName: "w-[85px] text-right",
      cell: (agent) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4 text-text-tertiary" />
              <span className="sr-only">{t("admin:table.actions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(agent)}>
                {t("common:buttons.edit")}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(agent)}
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

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  return (
    <AdminTable<Agent>
      data={sortedAgents}
      columns={columns}
      getRowKey={(row) => row.id}
      emptyMessage={effectiveEmptyMessage}
      striped
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
    />
  );
}
