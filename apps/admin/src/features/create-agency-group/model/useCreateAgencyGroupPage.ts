import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect } from "react";

import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { clearDraft } from "@/shared/lib/draftStorage";
import { safeParseSubmitData } from "@/shared/lib/form";
import { ROUTES, agencyGroupDetailPath } from "@/shared/lib/paths";

import {
  useCreateAgencyGroup,
  type CreateAgencyGroupPayload,
} from "../api/useCreateAgencyGroup";

import { createAgencyGroupSubmitSchema } from "./schema";
import {
  useCreateAgencyGroupForm,
  type CreateAgencyGroupFormData,
} from "./useCreateAgencyGroupForm";

export const CREATE_AGENCY_GROUP_DRAFT_KEY = "createAgencyGroupDraft";

/** Section ids must match Card ids in agency-group-form (create has no Agencies card). */
export const CREATE_AGENCY_GROUP_ANCHOR_SECTIONS = [
  { id: "general-information", label: "General" },
] as const;

const SECTION_IDS = CREATE_AGENCY_GROUP_ANCHOR_SECTIONS.map((s) => s.id);
const AGENCY_GROUPS_LIST_PATH = ROUTES.AGENCY_GROUPS;

const ERROR_KEY_TO_SECTION: Record<
  string,
  (typeof CREATE_AGENCY_GROUP_ANCHOR_SECTIONS)[number]["id"]
> = {
  name: "general-information",
  description: "general-information",
};

const SECTION_ORDER = [...SECTION_IDS];

function getFirstSectionWithError(
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

export function useCreateNewAgencyGroupPage(
  initialData?: CreateAgencyGroupFormData | null
) {
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !(SECTION_IDS as readonly string[]).includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [onSectionClick]);

  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useCreateAgencyGroupForm(initialData);

  const draftKey = CREATE_AGENCY_GROUP_DRAFT_KEY;

  const { mutate: createAgencyGroup, isPending } = useCreateAgencyGroup();

  const isDirty = formIsDirty;
  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: AGENCY_GROUPS_LIST_PATH,
    onPrepareDiscard: () => {
      clearDraft(draftKey);
      reset();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      createAgencyGroupSubmitSchema,
      form.state.values
    );
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    const groupPayload: CreateAgencyGroupPayload = {
      name: result.data.name,
      description: result.data.description,
      isActive: true,
    };

    createAgencyGroup(groupPayload, {
      onSuccess: (data) => {
        toast.success(
          i18n.t("modals.agencyGroupCreatedSuccess", { ns: "admin" })
        );
        clearDraft(draftKey);
        reset();
        if (data?.id) scheduleNavigateAfterSave(agencyGroupDetailPath(data.id));
      },
      onError: (err) => {
        const errorMessage = getErrorMessage(
          err,
          i18n.t("errors.failedToCreateAgencyGroup", { ns: "admin" })
        );
        toast.error(errorMessage);
      },
    });
  };

  return {
    form,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: CREATE_AGENCY_GROUP_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "create-agency-group-form",
    title: "Create New Agency Group",
    submitButtonLabel: "Save New Agency Group",
    description:
      "Newly created group will be active by default. You can add or remove agencies later. ",
  };
}
