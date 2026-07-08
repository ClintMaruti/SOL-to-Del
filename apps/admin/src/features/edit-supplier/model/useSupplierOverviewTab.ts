import {
  getErrorMessage,
  getValidationErrors,
  toFormErrors,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import type {
  SupplierDetail,
  UpdateSupplierPayload,
} from "@/entities/suppliers";
import { useSuppliers } from "@/entities/suppliers";
import { useToggleSupplierStatus } from "@/entities/suppliers/api/useToggleSupplierStatus";
import { useUpdateSupplier } from "@/entities/suppliers/api/useUpdateSupplier";
import type { CreateSupplierFormData } from "@/features/create-supplier";
import { supplierDetailToFormData } from "@/features/create-supplier";
import {
  applySupplierApiValidationErrorsToForm,
  applyZodIssuesToSupplierForm,
  clearSupplierActivationSubmitErrors,
  parseSupplierSubmitForForm,
} from "@/features/create-supplier/lib/supplierFormSubmitErrors";
import { safeParseSupplierActivationFields } from "@/features/create-supplier/model/schema";
import { getFirstSectionWithError } from "@/features/create-supplier/model/useCreateNewSupplierPage";
import { useCreateSupplierForm } from "@/features/create-supplier/model/useCreateSupplierForm";
import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { clearFormScopedOnSubmitFieldErrors } from "@/shared/lib/form";
import { ROUTES } from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { SUPPLIER_FORM_ANCHOR_SECTIONS } from "@/widgets/supplier-form";

import type { TabController } from "./types";

export type UseSupplierOverviewTabOptions = {
  /** Merge dirty state from other detail tabs (e.g. Notes) into the page-level unsaved blocker. */
  mergeUnsaved?: {
    isDirty: boolean;
    onDiscardMerged: () => void;
  };
};

const SECTION_IDS = SUPPLIER_FORM_ANCHOR_SECTIONS.map((s) => s.id);

function isSupplierNameDuplicate(
  name: string,
  suppliers: { id: string; name: string }[],
  excludeSupplierId?: string
): boolean {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return false;
  return suppliers.some(
    (s) => s.name.trim().toLowerCase() === trimmed && s.id !== excludeSupplierId
  );
}
const SUPPLIERS_LIST_PATH = ROUTES.SUPPLIERS;

export function useSupplierOverviewTab(
  supplier: SupplierDetail | null | undefined,
  supplierId: string | undefined,
  options?: UseSupplierOverviewTabOptions
) {
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);
  const { data: suppliers = [] } = useSuppliers();
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const { suppliersStatus } = useLoadingStates(
    useShallow((state) => ({ suppliersStatus: state.suppliersStatus }))
  );

  useEffect(() => {
    if (!supplierId) return;
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [supplierId, onSectionClick]);

  const initialFormData = useMemo(
    () => (supplier ? supplierDetailToFormData(supplier) : null),
    [supplier]
  );

  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useCreateSupplierForm(initialFormData);

  const { mutate: updateSupplier, isPending } = useUpdateSupplier();
  const { mutate: toggleSupplierStatus } = useToggleSupplierStatus();

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty: formIsDirty || Boolean(options?.mergeUnsaved?.isDirty),
    exitPath: SUPPLIERS_LIST_PATH,
    onPrepareDiscard: () => {
      reset(initialFormData ?? undefined);
      options?.mergeUnsaved?.onDiscardMerged();
    },
  });

  const applyToggleOrUpdateValidationError = useCallback(
    (err: unknown) => {
      const validation = getValidationErrors(err);
      if (validation) {
        applySupplierApiValidationErrorsToForm(
          form as never,
          validation.errors
        );
        const flat = toFormErrors(validation.errors);
        const fieldNames = Object.keys(flat);
        const firstSection = getFirstSectionWithError(fieldNames);
        if (firstSection) scrollToSection(firstSection);
      }
    },
    [form]
  );

  const requestToggleSupplierStatus = useCallback(
    (activate: boolean) => {
      if (!supplierId) {
        return;
      }

      clearSupplierActivationSubmitErrors(form as never);

      if (!activate) {
        toggleSupplierStatus(
          { supplierId, activate: false },
          {
            onError: (err) => {
              applyToggleOrUpdateValidationError(err);
            },
          }
        );
        return;
      }

      const values = form.store.state.values as CreateSupplierFormData;
      const activation = safeParseSupplierActivationFields(values);
      if (!activation.success) {
        applyZodIssuesToSupplierForm(form as never, activation.error.issues);
        const keys = activation.error.issues
          .map((i) => (i.path[0] != null ? String(i.path[0]) : ""))
          .filter(Boolean);
        const firstSection = getFirstSectionWithError(keys);
        if (firstSection) scrollToSection(firstSection);
        toast.error(
          i18n.t("errors.supplierActivationBlocked", { ns: "admin" })
        );
        return;
      }

      toggleSupplierStatus(
        { supplierId, activate: true },
        {
          onError: (err) => {
            applyToggleOrUpdateValidationError(err);
          },
        }
      );
    },
    [applyToggleOrUpdateValidationError, form, supplierId, toggleSupplierStatus]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);
    clearFormScopedOnSubmitFieldErrors(form);
    clearSupplierActivationSubmitErrors(form as never);

    if (!supplierId) {
      return;
    }

    const parsed = parseSupplierSubmitForForm(form as never, form.state.values);
    if (!parsed.success) {
      const firstSection = getFirstSectionWithError(parsed.fieldNames);
      if (firstSection) scrollToSection(firstSection);
      return;
    }

    const trimmedName = parsed.data.name.trim();
    if (
      supplierId &&
      trimmedName.length >= 3 &&
      isSupplierNameDuplicate(trimmedName, suppliers, supplierId)
    ) {
      setSchemaError(i18n.t("errors.supplierNameDuplicate", { ns: "admin" }));
      scrollToSection("general-information");
      return;
    }

    const submittedValues = parsed.data as CreateSupplierFormData;
    updateSupplier(
      {
        supplierId,
        payload: parsed.data as unknown as UpdateSupplierPayload,
      },
      {
        onSuccess: (data) => {
          setSchemaError(undefined);
          if (!data) {
            reset(submittedValues);
          }
        },
        onError: (err) => {
          const validation = getValidationErrors(err);
          if (validation) {
            applySupplierApiValidationErrorsToForm(
              form as never,
              validation.errors
            );
            const flat = toFormErrors(validation.errors);
            const fieldNames = Object.keys(flat);
            const firstSection = getFirstSectionWithError(fieldNames);
            if (firstSection) scrollToSection(firstSection);
            const firstMessage =
              Object.values(validation.errors)[0]?.[0] ?? validation.message;
            toast.error(firstMessage);
          } else {
            toast.error(
              getErrorMessage(
                err,
                i18n.t("errors.failedToUpdateSupplier", { ns: "admin" })
              )
            );
          }
        },
      }
    );
  };

  const controller: TabController = {
    formId: "supplier-detail-form",
    isPending,
    submitButtonLabel: "Save",
    handleSubmit,
    handleCancel,
    unsavedDialogOpen: showUnsavedDialog,
    handleUnsavedDiscard,
    handleUnsavedStay,
    schemaError,
    sections: SUPPLIER_FORM_ANCHOR_SECTIONS,
    activeSectionId,
    onSectionClick,
    showSidebar: true,
    wrapInForm: true,
  };

  const supplierStatusToggleLoading = Boolean(
    supplierId && suppliersStatus[supplierId]
  );

  return {
    controller,
    form,
    requestToggleSupplierStatus,
    supplierStatusToggleLoading,
  };
}
