import {
  ApiError,
  getErrorMessage,
  getValidationErrors,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import {
  clearFormScopedOnSubmitFieldErrors,
  getFieldNamesFromZodError,
  safeParseSubmitData,
} from "@/shared/lib/form";
import { ROUTES, agencyDetailPath } from "@/shared/lib/paths";
import { AGENCY_FORM_ANCHOR_SECTIONS } from "@/widgets/agency-form";

import { useCreateAgency } from "../api/useCreateAgency";
import { applyAgencyApiValidationErrors } from "./agencyApiValidationErrors";
import { agencySubmitSchema } from "./schema";
import { INITIAL_FORM_DATA, useCreateAgencyForm } from "./useCreateAgencyForm";

/** Known unique constraint names from backend → user-facing message */
const DUPLICATE_XERO_MESSAGES: Record<string, string> = {
  IX_Agencies_RWXeroID:
    "An agency with this RW Xero ID already exists. Please use a different value or leave it blank.",
  IX_Agencies_KenXeroID:
    "An agency with this KEN Xero ID already exists. Please use a different value or leave it blank.",
  IX_Agencies_TzXeroID:
    "An agency with this TZ Xero ID already exists. Please use a different value or leave it blank.",
  IX_Agencies_ZnzXeroID:
    "An agency with this ZNZ Xero ID already exists. Please use a different value or leave it blank.",
};

function getCreateAgencyErrorMessage(err: unknown): string {
  if (ApiError.isApiError(err) && err.data && typeof err.data === "object") {
    const body = err.data as { exception?: { details?: string } };
    const details = body.exception?.details ?? "";
    for (const [constraint, message] of Object.entries(
      DUPLICATE_XERO_MESSAGES
    )) {
      if (details.includes(constraint)) {
        return message;
      }
    }
  }
  return getErrorMessage(
    err,
    i18n.t("errors.failedToCreateAgency", { ns: "admin" })
  );
}

const SECTION_IDS = AGENCY_FORM_ANCHOR_SECTIONS.map((s) => s.id);
const AGENCIES_LIST_PATH = ROUTES.AGENCIES;

/** Map field names to anchor section ids (for scroll-to-error). */
export const ERROR_KEY_TO_SECTION: Record<
  string,
  (typeof SECTION_IDS)[number]
> = {
  agencyName: "general",
  agencyGroupIds: "general",
  sourceMarket: "general",
  assignedSafariPlannerId: "general",
  assignedSafariPlannerName: "general",
  iataCode: "general",
  email: "contacts",
  phone: "contacts",
  country: "contacts",
  city: "contacts",
  postalCode: "contacts",
  streetAddress: "contacts",
  website: "contacts",
  depositPercent: "terms",
  balanceDueDays: "terms",
  taxCode: "terms",
  hasCreditTerms: "terms",
  creditTermsNote: "terms",
  needsWhiteLabel: "other",
  whiteLabelNote: "other",
  agentZoneVisible: "other",
  agentZoneId: "other",
  agencyAffiliations: "other",
  kenXeroId: "other",
  rwXeroId: "other",
  tzXeroId: "other",
  znzXeroId: "other",
  additionalNotes: "other",
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

export function useCreateNewAgencyPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const agencyGroupId = searchParams.get("agencyGroupId");

  const exitPath = redirect ?? AGENCIES_LIST_PATH;

  const initialData =
    agencyGroupId != null && agencyGroupId !== ""
      ? { ...INITIAL_FORM_DATA, agencyGroupIds: [agencyGroupId] }
      : undefined;

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
  } = useCreateAgencyForm(initialData);

  const { mutate: createAgency, isPending } = useCreateAgency();

  const isDirty = formIsDirty;

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath,
    onPrepareDiscard: () => {
      reset();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormScopedOnSubmitFieldErrors(form);
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

    const result = safeParseSubmitData(agencySubmitSchema, form.state.values);
    if (!result.success) {
      setSchemaError(result.message);
      const zodErrorFieldNames = getFieldNamesFromZodError(result.error);
      const firstSection = getFirstSectionWithError(zodErrorFieldNames);
      if (firstSection) scrollToSection(firstSection);
      return;
    }

    createAgency(result.data, {
      onSuccess: (data) => {
        reset();
        setSchemaError(undefined);
        if (data) {
          const targetPath = redirect
            ? `${exitPath}?newAgencyId=${data.id}`
            : agencyDetailPath(data.id);
          scheduleNavigateAfterSave(targetPath);
        }
        toast.success(i18n.t("modals.agencyCreatedSuccess", { ns: "admin" }));
      },
      onError: (err) => {
        const validation = getValidationErrors(err);
        if (validation) {
          const formErrors = applyAgencyApiValidationErrors(
            form,
            validation.errors
          );
          setSchemaError(validation.message);

          const firstSection = getFirstSectionWithError(
            Object.keys(formErrors)
          );
          if (firstSection) scrollToSection(firstSection);
          return;
        }

        toast.error(getCreateAgencyErrorMessage(err));
      },
    });
  };

  return {
    form,
    schemaError,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: AGENCY_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "create-agency-form",
    title: "Create New Agency",
    submitButtonLabel: "Save New Agency",
    description:
      "Agencies start inactive until you add a Xero ID and activate them. You can add or remove agents later.",
  };
}
