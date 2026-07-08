import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office";
import { useCreateNewSupplierHeadOfficePage } from "@/features/create-supplier-head-office";
import { headOfficeDetailToFormData } from "@/features/edit-supplier-head-office/lib/headOfficeDetailToFormData";
import { SupplierHeadOfficeForm } from "@/widgets/supplier-head-office-form";

export interface DuplicateFromState {
  duplicateFrom?: SupplierHeadOffice | null;
}

/**
 * Create Supplier Head Office page.
 * Route-level composition: wires feature hook to form widget. No business logic.
 * Supports duplicate flow: navigate with state.duplicateFrom to pre-fill the form.
 */
export function CreateSupplierHeadOfficePage() {
  const { t } = useTranslation(["admin", "common"]);
  const location = useLocation();
  const state = location.state as DuplicateFromState | null;
  const duplicateFrom = state?.duplicateFrom;
  const initialData = duplicateFrom
    ? {
        ...headOfficeDetailToFormData(duplicateFrom),
        name: `${duplicateFrom.name} ${t("admin:pages.copySuffix")}`,
      }
    : undefined;

  const props = useCreateNewSupplierHeadOfficePage(initialData);
  return <SupplierHeadOfficeForm mode="create" {...props} />;
}
