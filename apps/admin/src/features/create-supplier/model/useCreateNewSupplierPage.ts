import {
  getErrorMessage,
  getValidationErrors,
  toFormErrors,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useState } from "react";

import { useSuppliers } from "@/entities/suppliers";
import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { clearFormScopedOnSubmitFieldErrors } from "@/shared/lib/form";
import { ROUTES, supplierDetailPath } from "@/shared/lib/paths";
import { SUPPLIER_FORM_ANCHOR_SECTIONS } from "@/widgets/supplier-form";

import { useCreateSupplier } from "../api/useCreateSupplier";
import {
  applySupplierApiValidationErrorsToForm,
  clearSupplierActivationSubmitErrors,
  parseSupplierSubmitForForm,
} from "../lib/supplierFormSubmitErrors";

import type { CreateSupplierFormData } from "./types";
import { useCreateSupplierForm } from "./useCreateSupplierForm";

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

const SECTION_IDS = SUPPLIER_FORM_ANCHOR_SECTIONS.map((s) => s.id);
const SUPPLIERS_LIST_PATH = ROUTES.SUPPLIERS;

export const ERROR_KEY_TO_SECTION: Record<
  string,
  (typeof SECTION_IDS)[number]
> = {
  name: "general-information",
  serviceType: "general-information",
  serviceTypeId: "general-information",
  headOfficeId: "general-information",
  type: "general-information",
  email: "contacts",
  additionalEmail: "contacts",
  secondAdditionalEmail: "contacts",
  xeroId: "finance",
  agentZoneId: "other",
  countryId: "address-location",
  locationId: "address-location",
};

const SECTION_ORDER = [...SECTION_IDS];

export function getFirstSectionWithError(
  errorFieldNames: string[]
): (typeof SECTION_IDS)[number] | null {
  for (const sectionId of SECTION_ORDER) {
    if (
      errorFieldNames.some((key) => ERROR_KEY_TO_SECTION[key] === sectionId)
    ) {
      return sectionId;
    }
  }
  return null;
}

export function useCreateNewSupplierPage() {
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);
  const { data: suppliers = [] } = useSuppliers();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [onSectionClick]);

  const [schemaError, setSchemaError] = useState<string | undefined>();

  const { form, isDirty: formIsDirty, reset } = useCreateSupplierForm();

  const { mutate: createSupplier, isPending } = useCreateSupplier();

  const isDirty = formIsDirty;

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: SUPPLIERS_LIST_PATH,
    onPrepareDiscard: () => {
      reset();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);
    clearFormScopedOnSubmitFieldErrors(form);
    clearSupplierActivationSubmitErrors(form as never);

    const parsed = parseSupplierSubmitForForm(form as never, form.state.values);
    if (!parsed.success) {
      const firstSection = getFirstSectionWithError(parsed.fieldNames);
      if (firstSection) scrollToSection(firstSection);
      return;
    }

    const trimmedName = parsed.data.name.trim();
    if (
      trimmedName.length >= 3 &&
      isSupplierNameDuplicate(trimmedName, suppliers)
    ) {
      setSchemaError(i18n.t("errors.supplierNameDuplicate", { ns: "admin" }));
      scrollToSection("general-information");
      return;
    }

    createSupplier(parsed.data as CreateSupplierFormData, {
      onSuccess: (data) => {
        toast.success(i18n.t("modals.supplierCreatedSuccess", { ns: "admin" }));
        reset();
        setSchemaError(undefined);
        if (data) scheduleNavigateAfterSave(supplierDetailPath(data.id));
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
              i18n.t("errors.failedToCreateSupplier", { ns: "admin" })
            )
          );
        }
      },
    });
  };
  return {
    form,
    schemaError,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: SUPPLIER_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "create-supplier-form",
    title: "Create Supplier",
    submitButtonLabel: "Save",
    description:
      "Add a new supplier to the system. The supplier will be available for assignment once created.",
  };
}
