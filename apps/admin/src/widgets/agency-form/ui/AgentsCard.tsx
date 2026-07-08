import { getErrorMessage, useQueryClient } from "@sol/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@sol/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteAgent } from "@/entities/agent/api/useDeleteAgent";
import { useToggleAgentStatus } from "@/entities/agent/api/useToggleAgentStatus";
import type { Agent } from "@/entities/agent/model/types";
import { ConfirmDeleteDialog } from "@/shared/ui";

import { AgentsTable } from "./AgentsTable";

interface AgentsCardProps {
  /** Agents to display in the table (e.g. agents linked to this agency) */
  agents?: Agent[];
  /** Agency id (for invalidating agency query after delete). When provided, delete is enabled. */
  agencyId?: string;
  /** When set, agent name is a link/button that navigates to the agent (e.g. view/update agency page) */
  onAgentNameClick?: (agent: Agent) => void;
  /** Called when the user toggles an agent's active status */
  onToggleActive?: (agent: Agent, checked: boolean) => void;
  /** Called when the user clicks Edit on an agent */
  onEdit?: (agent: Agent) => void;
  /** Called after an agent is successfully deleted (e.g. to update parent's local agents list) */
  onAgentDeleted?: (agent: Agent) => void;
}

function getAgentDisplayName(agent: Agent): string {
  return agent.firstName?.concat(" ", agent.lastName ?? "").trim() || "—";
}

export function AgentsCard({
  agents = [],
  agencyId,
  onAgentNameClick,
  onToggleActive,
  onEdit,
  onAgentDeleted,
}: AgentsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleteError, setDeleteError] = useState<Error | null>(null);
  const deleteDialogOpen = agentToDelete !== null;

  const { mutate: deleteAgent, isPending: isDeletePending } = useDeleteAgent();
  const { mutate: toggleStatus } = useToggleAgentStatus();

  const handleToggleActive = (agent: Agent, checked: boolean) => {
    toggleStatus(
      { agentId: agent.id, activate: checked },
      { onSuccess: () => onToggleActive?.(agent, checked) }
    );
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setAgentToDelete(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!agentToDelete) return;
    setDeleteError(null);
    deleteAgent(agentToDelete.id, {
      onSuccess: () => {
        if (agencyId) {
          queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
        }
        onAgentDeleted?.(agentToDelete);
        setAgentToDelete(null);
      },
      onError: (err) => {
        setDeleteError(
          err instanceof Error
            ? err
            : new Error(getErrorMessage(err, t("errors.failedToDeleteAgent")))
        );
      },
    });
  };

  return (
    <Card id="agents">
      <CardHeader>
        <div className="flex items-center justify-between self-stretch gap-4">
          <div className="flex-1">
            <CardTitle className="text-base font-bold text-text-primary leading-6">
              {t("sections.agents")}
            </CardTitle>
            <p className="text-sm text-text-secondary font-medium leading-6">
              {t("sections.agentsDescription")}
            </p>
          </div>
        </div>
      </CardHeader>
      {agents.length > 0 && (
        <CardContent className="space-y-4">
          <AgentsTable
            agents={agents}
            onAgentNameClick={onAgentNameClick}
            onToggleActive={handleToggleActive}
            onEdit={onEdit}
            onDelete={agencyId ? (agent) => setAgentToDelete(agent) : undefined}
          />
        </CardContent>
      )}

      {agentToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          title={t("delete.deleteAgent")}
          description={t("delete.deleteAgentConfirm", {
            name: getAgentDisplayName(agentToDelete),
          })}
          confirmLabel={t("common:buttons.delete")}
          isPending={isDeletePending}
          error={deleteError}
          defaultErrorMessage={t("errors.failedToDeleteAgent")}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Card>
  );
}
