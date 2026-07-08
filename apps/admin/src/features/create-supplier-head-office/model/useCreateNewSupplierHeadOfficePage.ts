import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useState } from "react";

import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { safeParseSubmitData } from "@/shared/lib/form";
import { ROUTES, headOfficeDetailPath } from "@/shared/lib/paths";
import { SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS } from "@/widgets/supplier-head-office-form";

import { useCreateSupplierHeadOffice } from "../api/useCreateSupplierHeadOffice";

import type { CreateSupplierHeadOfficeFormData } from "./types";
import { createSupplierHeadOfficeSubmitSchema } from "./schema";
import { useCreateSupplierHeadOfficeForm } from "./useCreateSupplierHeadOfficeForm";

const SECTION_IDS = SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS.map((s) => s.id);
const HEAD_OFFICES_LIST_PATH = ROUTES.SUPPLIER_HEAD_OFFICES;

export const ERROR_KEY_TO_SECTION: Record<
  string,
  (typeof SECTION_IDS)[number]
> = {
  name: "general-information",
  email: "contacts-and-address",
  phoneNumber: "contacts-and-address",
  additionalEmail: "contacts-and-address",
  website: "contacts-and-address",
  country: "contacts-and-address",
  city: "contacts-and-address",
  postalCode: "contacts-and-address",
  streetAddress: "contacts-and-address",
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

export function useCreateNewSupplierHeadOfficePage(
  initialData?: CreateSupplierHeadOfficeFormData | null
) {
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);
  const [schemaError, setSchemaError] = useState<string | undefined>();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [onSectionClick]);

  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useCreateSupplierHeadOfficeForm(initialData);

  const { mutate: createHeadOffice, isPending } = useCreateSupplierHeadOffice();

  const isDirty = formIsDirty;

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: HEAD_OFFICES_LIST_PATH,
    onPrepareDiscard: () => {
      reset();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid) {
      const fieldMeta = form.state.fieldMeta as Record<
        string,
        { errors?: string[] } | undefined
      >;
      const errorFieldNames = Object.keys(fieldMeta).filter(
        (key) => (fieldMeta[key]?.errors?.length ?? 0) > 0
      );
      const firstSection = getFirstSectionWithError(errorFieldNames);
      if (firstSection) scrollToSection(firstSection);
      return;
    }

    const result = safeParseSubmitData(
      createSupplierHeadOfficeSubmitSchema,
      form.state.values
    );
    if (!result.success) {
      setSchemaError(result.message);
      return;
    }

    createHeadOffice(result.data, {
      onSuccess: (data) => {
        reset();
        setSchemaError(undefined);
        if (data) scheduleNavigateAfterSave(headOfficeDetailPath(data.id));
        toast.success(
          i18n.t("modals.headOfficeCreatedSuccess", { ns: "admin" })
        );
      },
      onError: (err) => {
        const errorMessage = getErrorMessage(
          err,
          i18n.t("errors.failedToCreateHeadOffice", { ns: "admin" })
        );
        toast.error(errorMessage);
      },
    });
  };

  return {
    form,
    schemaError,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "create-supplier-head-office-form",
    title: "Create Head Office",
    submitButtonLabel: "Save New Head Office",
    description:
      "Add a new Head Office to the system. Its supplier will be available for assignment once created.",
  };
}
