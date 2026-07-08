import type { SectionAnchorItem } from "@/shared/ui";

/**
 * Minimal form data shape required by AgentForm cards.
 * Both CreateAgentFormData and EditAgentFormData satisfy this.
 */
export interface AgentFormDataMinimal {
  firstName: string;
  lastName: string;
  agencyId: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  primaryEmail: string;
  phone: string;
  alternateEmail: string;
  notes: string;
}

export interface AgentFormErrorsMinimal {
  firstName?: string;
  lastName?: string;
  agencyId?: string;
  assignedSafariPlannerId?: string;
  primaryEmail?: string;
  alternateEmail?: string;
}

/**
 * Shared props for AgentForm. Accepts the return type of useAgentDetailPage
 * (excluding isLoading, isError, agent) or useCreateNewAgentPage.
 * Defined as an interface so AgentForm can destructure optional props.
 */
export interface AgentFormProps {
  formData: AgentFormDataMinimal;
  errors: AgentFormErrorsMinimal;
  updateField: <K extends keyof AgentFormDataMinimal>(
    field: K,
    value: AgentFormDataMinimal[K]
  ) => void;
  isPending: boolean;
  activeSectionId: string | null;
  sections: readonly SectionAnchorItem[];
  formId: string;
  title: string;
  submitButtonLabel: string;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  description?: string;
  /** Create: agency dropdown options. Edit: not set. */
  agencies?: { id: string; name: string }[];
  /** Edit: agency display name (read-only). Create: not set. */
  agencyName?: string;
  unsavedDialogOpen?: boolean;
  handleUnsavedDiscard?: () => void;
  handleUnsavedStay?: () => void;
  showActiveToggle?: boolean;
  isActive?: boolean;
  onStatusChange?: (checked: boolean) => void;
  /** Called when a spy-scroll section is clicked. Used to highlight that section when the form is short. */
  onSectionClick?: (sectionId: string) => void;
}
