import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useToggleAgentStatus } from "@/entities/agent/api/useToggleAgentStatus";
import type { Agent } from "@/entities/agent/model/types";
import { DeleteAgentDialog } from "@/features/delete-agent";
import { useOpenStateWithCleanupOnClose } from "@/shared/hooks";
import { ROUTES } from "@/shared/lib/paths";
import { AgentList } from "@/widgets/agent-list";

export function AgentsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { innerPageId } = useParams<{ innerPageId?: string }>();
  const [searchParams] = useSearchParams();
  const agencyId = searchParams.get("agencyId");
  const navigate = useNavigate();
  const { mutate: toggleAgentStatus } = useToggleAgentStatus();
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useOpenStateWithCleanupOnClose(false, () => setAgentToDelete(null));

  // Show main agents content when innerPageId is "agents" or undefined
  const showMainContent = !innerPageId || innerPageId === "agents";

  const handleToggleStatus = (agent: Agent) => {
    toggleAgentStatus({
      agentId: agent.id,
      activate: !agent.isActive,
    });
  };

  const handleDelete = (agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleCreateAgent = () => {
    navigate(ROUTES.AGENTS_CREATE);
  };

  return (
    <div className="p-4">
      {showMainContent ? (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="leading-10 text-neutral-900">
                {t("admin:pages.agents")}
              </h1>
              <p className="max-w-2xl leading-6 text-neutral-600 text-sm font-medium">
                {t("admin:pages.agentsDescription")}
              </p>
            </div>
            <Button
              onClick={handleCreateAgent}
              variant="primary"
              className="shrink-0"
            >
              <Plus />
              {t("common:buttons.create")}
            </Button>
          </div>

          <AgentList
            agencyId={agencyId}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onCreateAgent={handleCreateAgent}
          />

          <DeleteAgentDialog
            agent={agentToDelete}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      ) : (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t("admin:pages.innerPage", { id: innerPageId })}
          </h2>
        </div>
      )}
    </div>
  );
}
