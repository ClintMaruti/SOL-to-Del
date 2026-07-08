import type { AnyFormApi, SectionAnchorItem } from "@/shared/ui";

export interface AgencyGroupFormProps {
  form: AnyFormApi;
  isPending: boolean;
  activeSectionId: string | null;
  onSectionClick?: (sectionId: string) => void;
  sections: readonly SectionAnchorItem[];
  formId: string;
  title: string;
  submitButtonLabel: string;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  description?: string;
  /** Schema-level validation error shown below the form */
  schemaError?: string;

  unsavedDialogOpen?: boolean;
  handleUnsavedDiscard?: () => void;
  handleUnsavedStay?: () => void;
  showActiveToggle?: boolean;
  isActive?: boolean;
  onStatusChange?: (checked: boolean) => void;
  /** Props for the blocked-deactivation warning dialog shown when the group has active agencies. */
  blockedStatusDialog?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
  };
  /** Props for the suspend/reactivate confirmation dialog (detail page). */
  statusConfirmDialog?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    isPending: boolean;
    onConfirm: () => void;
    confirmVariant?: "default" | "destructive";
  };
  /** True while the status toggle API is in progress (disables switch). */
  isTogglingStatus?: boolean;
  redirectPath?: string;
  mode: "create" | "edit";
}
