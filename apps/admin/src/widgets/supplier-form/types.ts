import type { TabController } from "@/shared/types";
import type { AnyFormApi } from "@/shared/ui/form";

export interface SupplierFormProps extends Omit<TabController, "content"> {
  title?: string;
  description?: string;
  mode: "create" | "edit";
  tabs?: React.ReactNode;
  subHeader?: React.ReactNode;
  headerExtra?: React.ReactNode;
  /** Form API for rendering the built-in overview card sections. */
  form?: AnyFormApi;
  /** When true, render only form content (no header, meta, tabs, footer). Caller provides chrome. */
  contentOnly?: boolean;
  /** When true, omit built-in UnsavedChangesDialog (caller renders one at page level). */
  suppressUnsavedDialog?: boolean;
}
