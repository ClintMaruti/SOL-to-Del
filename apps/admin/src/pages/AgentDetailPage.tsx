import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useAgentDetailPage } from "@/features/edit-agent";
import { ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";
import { AgentForm, AgentDetailSkeleton } from "@/widgets/agent-form";

function AgentDetailContent({ agentId }: { agentId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useAgentDetailPage({ agentId });

  if (props.isLoading) {
    return <AgentDetailSkeleton />;
  }

  if (props.isError || !props.agent) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.agent")}
          description={t("notFound.agentDescription")}
          actionLabel={t("buttons.backToAgents")}
          onAction={() => navigate(ROUTES.AGENTS)}
        />
      </div>
    );
  }

  return <AgentForm {...props} />;
}

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("admin");

  if (!id) {
    return (
      <div className="p-6 text-muted-foreground">
        {t("notFound.missingAgentId")}
      </div>
    );
  }

  return <AgentDetailContent agentId={id} />;
}
