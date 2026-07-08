import type { Agent } from "@/entities/agent/model/types";
import type { SectionAnchorItem } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";

export interface AgencyFormProps {
  form: AnyFormApi;
  /** Schema validation error shown after form fields, cleared on next submit */
  schemaError?: string;
  agents?: Agent[];
  isPending: boolean;
  activeSectionId: string | null;
  onSectionClick?: (sectionId: string) => void;
  sections: readonly SectionAnchorItem[];
  unsavedDialogOpen: boolean;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleUnsavedDiscard: () => void;
  handleUnsavedStay: () => void;
  formId: string;
  title: string;
  submitButtonLabel: string;
  description?: string;

  toggleAgentActive?: (agent: Agent, checked: boolean) => void;
  onAgentDeleted?: (agent: Agent) => void;

  // Edit mode only: edit existing agent in modal
  createAgentModalOpen?: boolean;
  setCreateAgentModalOpen?: (open: boolean) => void;

  // Detail mode
  showActiveToggle?: boolean;
  agencyStatusActive?: boolean;
  handleToggleAgencyStatus?: (checked: boolean) => void;
  /** KEN Xero ID from the form (edit) — gates activation like suppliers. */
  activationKenXeroId?: string;
  handleAgentNameClick?: (agent: Agent) => void;
  agentToEdit?: Agent | null;
  editAgent?: (agent: Agent) => void;
  onUpdateAgent?: (agent: Agent) => void;
  agencyId?: string;
  mode: "create" | "edit";
}
