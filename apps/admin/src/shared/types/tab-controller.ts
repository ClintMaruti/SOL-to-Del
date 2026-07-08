import type React from "react";

import type { SectionAnchorItem } from "@/shared/ui";

import type { UseActiveSectionReturn } from "../hooks/useActiveSection";

/**
 * Common contract that every supplier-detail tab hook must satisfy.
 * The page selects the active tab's controller and passes it to SupplierForm / FormPageLayout.
 */
export interface TabController extends Pick<
  UseActiveSectionReturn,
  "activeSectionId" | "onSectionClick"
> {
  formId: string;
  isPending: boolean;
  submitButtonLabel: string;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancel: () => void;
  unsavedDialogOpen: boolean;
  handleUnsavedDiscard: () => void;
  handleUnsavedStay: () => void;
  schemaError?: string;
  sections: readonly SectionAnchorItem[];
  activeSectionId: string | null;
  showSidebar?: boolean;
  wrapInForm?: boolean;
  /** Tab body rendered by FormPageLayout. When undefined, SupplierForm renders overview cards via the `form` prop. */
  content?: React.ReactNode;
}
