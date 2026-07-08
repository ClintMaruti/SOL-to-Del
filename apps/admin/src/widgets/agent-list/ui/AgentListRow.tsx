import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  TableCell,
  TableRow,
} from "@sol/ui";
import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import type { Agent } from "@/entities/agent/model/types";
import { useHighlightMatch } from "@/shared/hooks";
import { agentDetailPath, ROUTES } from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { AgencyGroupLinks, CopyableCell } from "@/shared/ui";

interface AgentListRowProps {
  isEven: boolean;
  searchQuery: string;
  agent: Agent;
  onDelete?: (agent: Agent) => void;
  onToggleStatus?: (agent: Agent) => void;
}

export function AgentListRow({
  isEven,
  searchQuery,
  agent,
  onDelete,
  onToggleStatus,
}: AgentListRowProps) {
  const { t } = useTranslation("admin");
  const fullName = `${agent.firstName} ${agent.lastName}`;
  const agentName = useHighlightMatch(fullName, searchQuery);
  const agencyName = useHighlightMatch(agent.agencyName || "", searchQuery);
  const assignedSafariPlanner = useHighlightMatch(
    agent.assignedSafariPlannerName ?? "",
    searchQuery
  );
  const email = useHighlightMatch(agent.primaryEmail, searchQuery);
  const { agentsStatus } = useLoadingStates(
    useShallow((state) => ({ agentsStatus: state.agentsStatus }))
  );
  return (
    <TableRow
      className={cn(
        isEven ? "bg-gray-50" : "bg-white",
        "h-[40px]! text-neutral-900 text-sm font-medium"
      )}
      key={agent.id}
    >
      <TableCell className="border-r pl-4 pr-2 py-2">
        <Link
          to={agentDetailPath(agent.id)}
          className="text-blue-500 hover:underline font-medium text-left text-sm"
        >
          {agentName}
        </Link>
      </TableCell>
      <TableCell className="border-r p-2">
        {agent.agencyName ? (
          <Link
            to={`${ROUTES.AGENCIES}?search=${encodeURIComponent(agent.agencyName || "")}`}
            className="text-blue-500 hover:underline font-medium text-left text-sm"
          >
            {agencyName}
          </Link>
        ) : (
          <span className="text-sm">{agencyName}</span>
        )}
      </TableCell>
      <TableCell className="border-r p-2">
        <AgencyGroupLinks
          groups={agent.agencyGroups}
          searchQuery={searchQuery}
        />
      </TableCell>
      <TableCell className="border-r p-2 max-w-0">
        <CopyableCell value={email as string} cellId={`${agent.id}-email`} />
      </TableCell>
      <TableCell className="border-r p-2 max-w-0">
        <CopyableCell value={agent.phoneNumber} cellId={`${agent.id}-phone`} />
      </TableCell>
      <TableCell className="border-r p-2">{assignedSafariPlanner}</TableCell>
      <TableCell className="border-r border-border p-2 align-middle">
        <div className="flex min-h-9 items-center justify-end">
          <Switch
            checked={agent.isActive}
            onCheckedChange={() => onToggleStatus?.(agent)}
            aria-label={t("aria.toggleActiveStatus", { name: fullName })}
            size="sm"
            loading={agentsStatus[agent.id]}
          />
        </div>
      </TableCell>
      <TableCell className="p-2">
        <div className="flex justify-end">
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("aria.actionsFor", { name: fullName })}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-sm shadow-none border-gray-200 px-1"
              >
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(agent)}
                  className="py-1.5 px-2 text-sm font-medium"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
