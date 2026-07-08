import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect } from "react";

import { useAgencies } from "@/entities/agency/api/useAgencies";
import { useAgent } from "@/entities/agent/api/useAgent";
import { useUpdateAgent } from "@/entities/agent/api/useUpdateAgent";
import {
  useAgentForm,
  getInitialFormData,
} from "@/features/edit-agent/model/useAgentForm";
import { useUnsavedChangesBlocker, useActiveSection } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { ROUTES, agentDetailPath } from "@/shared/lib/paths";
import { AGENT_FORM_ANCHOR_SECTIONS } from "@/widgets/agent-form";

const AGENT_DETAIL_FORM_ID = "agent-detail-form";
const SECTION_IDS = AGENT_FORM_ANCHOR_SECTIONS.map((s) => s.id);
const AGENTS_LIST_PATH = ROUTES.AGENTS;

function getAgentName(
  agent: { firstName?: string; lastName?: string } | null
): string {
  if (!agent) return "";
  const first = agent.firstName?.trim() ?? "";
  const last = agent.lastName?.trim() ?? "";
  if (!first && !last) return "Agent";
  return [first, last].filter(Boolean).join(" ");
}

export interface UseAgentDetailPageOptions {
  agentId: string;
}

export function useAgentDetailPage({ agentId }: UseAgentDetailPageOptions) {
  const { data: agent, isLoading, isError } = useAgent(agentId);
  const { data: agencies = [] } = useAgencies();
  const {
    formData,
    errors,
    updateField,
    validate,
    getSubmitData,
    reset,
    isDirty,
  } = useAgentForm(agent ?? null);
  const { mutate: updateAgent, isPending } = useUpdateAgent();
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);

  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [isLoading, onSectionClick]);

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: AGENTS_LIST_PATH,
    onPrepareDiscard: () => reset(),
  });

  const handleStatusChange = (checked: boolean) => {
    updateField("status", checked ? "Active" : "Inactive");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid } = validate();
    if (!agent || !valid) return;
    const data = getSubmitData();
    if (!data) return;
    updateAgent(
      { id: agent.id, data: { ...data, version: agent.version } },
      {
        onSuccess: (data) => {
          toast.success("Agent updated successfully.");
          reset(data ? getInitialFormData(data) : undefined);
          if (data?.id) scheduleNavigateAfterSave(agentDetailPath(data.id));
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(
              error,
              i18n.t("errors.failedToUpdateAgent", { ns: "admin" })
            )
          );
        },
      }
    );
  };

  const agentName = agent ? getAgentName(agent) : "";
  const agencyName = agent
    ? (agent.agencyName ??
      agencies.find((a) => a.id === agent.agencyId)?.name ??
      "")
    : "";

  const agencyOptions = agencies.map((a) => ({ id: a.id, name: a.name }));

  return {
    isLoading,
    isError,
    agent,
    formData,
    errors,
    updateField,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: AGENT_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    formId: AGENT_DETAIL_FORM_ID,
    title: agentName,
    submitButtonLabel: "Save",
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    handleSubmit,
    agencies: agencyOptions,
    agencyName,
    showActiveToggle: true,
    isActive: formData.status === "Active",
    onStatusChange: handleStatusChange,
  };
}
