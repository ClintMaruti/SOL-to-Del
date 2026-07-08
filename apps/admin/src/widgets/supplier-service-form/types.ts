import type { SupplierService } from "@/entities/supplier-services";
import type { SectionAnchorItem } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";

export interface EditSupplierServiceFormProps {
  form: AnyFormApi;
  supplierService: SupplierService;
  schemaError?: string;
  isPending: boolean;
  activeSectionId: string | null;
  sections: readonly SectionAnchorItem[];
  unsavedDialogOpen: boolean;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleUnsavedDiscard: () => void;
  handleUnsavedStay: () => void;
  formId: string;
  title: string;
  submitButtonLabel: string;
  headerExtra?: React.ReactNode;
  tabs?: React.ReactNode;
  contentOnly?: boolean;
}
