import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect } from "react";
import type { AgentFormErrors } from "@/features/edit-agent/model/useAgentForm";
import { useAgentForm } from "@/features/edit-agent/model/useAgentForm";
import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { safeParseSubmitData } from "@/shared/lib/form";
import { ROUTES, agentDetailPath } from "@/shared/lib/paths";

import { useCreateAgent } from "../api/useCreateAgent";

import { createAgentSubmitSchema } from "./schema";

/** Section ids must match Card ids in agent-form for shared form cards. */
export const CREATE_AGENT_ANCHOR_SECTIONS = [
  { id: "general-information", label: "General" },
  { id: "contacts-address", label: "Contacts & Address" },
  { id: "other", label: "Other" },
] as const;

const SECTION_IDS = CREATE_AGENT_ANCHOR_SECTIONS.map((s) => s.id);
const AGENTS_LIST_PATH = ROUTES.AGENTS;

const ERROR_KEY_TO_SECTION: Record<
  string,
  (typeof CREATE_AGENT_ANCHOR_SECTIONS)[number]["id"]
> = {
  firstName: "general-information",
  lastName: "general-information",
  agencyId: "general-information",
  assignedSafariPlannerId: "general-information",
  primaryEmail: "contacts-address",
  alternateEmail: "contacts-address",
  phone: "contacts-address",
};

const SECTION_ORDER = [...SECTION_IDS];

function getFirstSectionWithError(
  errors: AgentFormErrors
): (typeof SECTION_IDS)[number] | null {
  const errorKeys = (Object.keys(errors) as (keyof AgentFormErrors)[]).filter(
    (k) => errors[k]
  );
  for (const sectionId of SECTION_ORDER) {
    if (errorKeys.some((key) => ERROR_KEY_TO_SECTION[key] === sectionId)) {
      return sectionId;
    }
  }
  return null;
}

export function useCreateNewAgentPage() {
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !(SECTION_IDS as readonly string[]).includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [onSectionClick]);

  const { formData, errors, updateField, validate, reset, isDirty } =
    useAgentForm();

  const { mutate: createAgent, isPending } = useCreateAgent();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors: validationErrors } = validate();
    if (!valid) {
      const firstSection = getFirstSectionWithError(validationErrors);
      if (firstSection) scrollToSection(firstSection);
      return;
    }
    const result = safeParseSubmitData(createAgentSubmitSchema, formData);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    createAgent(result.data, {
      onSuccess: (data) => {
        toast.success("Agent created successfully.");
        reset();
        if (data?.id) scheduleNavigateAfterSave(agentDetailPath(data.id));
      },
      onError: (err) => {
        const errorMessage = getErrorMessage(
          err,
          i18n.t("errors.failedToCreateAgent", { ns: "admin" })
        );
        toast.error(errorMessage);
      },
    });
  };

  return {
    formData,
    errors,
    updateField,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: CREATE_AGENT_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "create-agent-form",
    title: "Create New Agent",
    submitButtonLabel: "Save New Agent",
    description: "Newly created agent will be active by default.",
  };
}
