import type { Supplier } from "@/entities/suppliers/model/types";
import type { SectionAnchorItem } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";

export interface SupplierHeadOfficeFormProps {
  mode: "create" | "edit";
  headOfficeId?: string;
  form: AnyFormApi;
  schemaError?: string;
  isPending: boolean;
  activeSectionId: string | null;
  /** Called when a sidebar section link is clicked. Use to highlight that section immediately. */
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
  /** Rendered in header (e.g. Active toggle). Used in edit mode. */
  headerExtra?: React.ReactNode;
  /** Suppliers for this head office (edit mode). Passed to SuppliersCard. */
  suppliers?: Supplier[];
  /** Called when a supplier name is clicked in the table (edit mode). */
  onSupplierNameClick?: (supplierId: string) => void;
  /** Called when a supplier's Active toggle is changed (edit mode). */
  onToggleSupplierStatus?: (supplier: Supplier) => void;
  /** Called to delete (remove) a supplier from this head office (edit mode). */
  onDeleteSupplier?: (
    supplier: Supplier,
    callbacks?: { onSuccess?: () => void }
  ) => void;
  /** Whether delete is available (another head office exists). */
  canDelete?: boolean;
  /** Delete mutation is in progress. */
  isDeletePending?: boolean;
  /** Delete mutation error. */
  deleteError?: Error | null;
  /** Clear delete error. */
  resetDeleteError?: () => void;
}
