import { getErrorMessage, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useAgencies } from "@/entities/agency/api/useAgencies";
import { useUpdateAgencyMemberships } from "@/entities/agency/api/useUpdateAgencyMemberships";
import type { Agency } from "@/entities/agency/model/types";
import {
  useAgencyGroup,
  useToggleAgencyGroupStatus,
  useUpdateAgencyGroup,
} from "@/entities/agency-group";
import type { AgencyGroup } from "@/entities/agency-group/model/types";
import { createAgencyGroupSubmitSchema } from "@/features/create-agency-group/model/schema";
import {
  useCreateAgencyGroupForm,
  type CreateAgencyGroupFormData,
} from "@/features/create-agency-group/model/useCreateAgencyGroupForm";
import {
  useActiveSection,
  useDebouncedValue,
  useUnsavedChangesBlocker,
} from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { clearDraft, setDraft } from "@/shared/lib/draftStorage";
import { safeParseSubmitData } from "@/shared/lib/form";
import { ROUTES } from "@/shared/lib/paths";
import type { SectionAnchorItem } from "@/shared/ui";
import { AGENCY_GROUP_FORM_ANCHOR_SECTIONS } from "@/widgets/agency-group-form";

const SECTION_IDS = AGENCY_GROUP_FORM_ANCHOR_SECTIONS.map(
  (s: SectionAnchorItem) => s.id
);

const AGENCY_GROUPS_LIST_PATH = ROUTES.AGENCY_GROUPS;

const ERROR_KEY_TO_SECTION: Record<string, string> = {
  name: "general-information",
  description: "general-information",
  agencies: "agencies",
};

function getFirstSectionWithError(errorFieldNames: string[]): string | null {
  for (const sectionId of SECTION_IDS) {
    if (
      errorFieldNames.some((key) => ERROR_KEY_TO_SECTION[key] === sectionId)
    ) {
      return sectionId;
    }
  }
  return null;
}

export function useAgencyGroupDetailPage() {
  const { agencyGroupId } = useParams<{ agencyGroupId: string }>();
  const { t } = useTranslation("admin");
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);
  const [schemaError, setSchemaError] = useState<string | undefined>();
  const [agencyGroupStatusActive, setAgencyGroupStatusActive] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<
    boolean | null
  >(null);
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);

  const draftKey = agencyGroupId ? `editAgencyGroupDraft_${agencyGroupId}` : "";

  const {
    data: agencyGroup,
    isLoading,
    error,
  } = useAgencyGroup(agencyGroupId ?? null);
  const { data: allAgencies = [] } = useAgencies();

  // Filter agencies that belong to this group by matching the group id.
  const groupAgencies = useMemo(
    () =>
      agencyGroup
        ? allAgencies.filter((a) =>
            (a.agencyGroupIds ?? []).includes(agencyGroup.id)
          )
        : [],
    [agencyGroup, allAgencies]
  );
  const groupAgencyIdsKey = useMemo(
    () =>
      groupAgencies
        .map((agency) => agency.id)
        .sort()
        .join("|"),
    [groupAgencies]
  );

  const initialFormData = useMemo<CreateAgencyGroupFormData | null>(() => {
    if (!agencyGroup) return null;
    const serverData: CreateAgencyGroupFormData = {
      name: agencyGroup.name ?? "",
      description: agencyGroup.description ?? "",
      agencies: groupAgencies.map((a) => a.id),
    };
    return serverData;
    // Re-compute when group identity, name/description, or member agencies change
    // (name/description needed so form fields update after optimistic cache update on save).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agencyGroup?.id,
    agencyGroup?.name,
    agencyGroup?.description,
    groupAgencyIdsKey,
  ]);

  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useCreateAgencyGroupForm(initialFormData);

  // Draft auto-save (debounced) so unsaved edits survive accidental navigation.
  const formValues = useStore(form.store, (state) => state.values);
  const debouncedValues = useDebouncedValue(formValues, 400);

  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [isLoading, onSectionClick]);

  useEffect(() => {
    if (!formIsDirty || !draftKey) return;
    setDraft<CreateAgencyGroupFormData>(draftKey, {
      name: (debouncedValues as CreateAgencyGroupFormData).name ?? "",
      description:
        (debouncedValues as CreateAgencyGroupFormData).description ?? "",
      agencies: (debouncedValues as CreateAgencyGroupFormData).agencies ?? [],
    });
  }, [debouncedValues, formIsDirty, draftKey]);

  useEffect(() => {
    if (agencyGroup) {
      setAgencyGroupStatusActive(agencyGroup.isActive ?? false);
    }
  }, [agencyGroup?.id, agencyGroup?.isActive]);

  const queryClient = useQueryClient();
  const { mutateAsync: updateAgencyGroup, isPending: isUpdatingAgencyGroup } =
    useUpdateAgencyGroup();
  const {
    mutateAsync: updateAgencyMemberships,
    isPending: isUpdatingAgencyMemberships,
  } = useUpdateAgencyMemberships();
  const { mutate: toggleStatus, isPending: isToggling } =
    useToggleAgencyGroupStatus();
  const isPending = isUpdatingAgencyGroup || isUpdatingAgencyMemberships;

  const isDirty = formIsDirty;

  const redirectPath = `${AGENCY_GROUPS_LIST_PATH}/${agencyGroupId}`;
  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: AGENCY_GROUPS_LIST_PATH,
    onPrepareDiscard: () => {
      if (draftKey) clearDraft(draftKey);
      reset(initialFormData ?? undefined);
      setAgencyGroupStatusActive(agencyGroup?.isActive ?? false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid || !agencyGroupId) {
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
      setSchemaError(result.message);
      return;
    }

    const groupPayload = {
      name: result.data.name,
      description: result.data.description || null,
      isActive: agencyGroupStatusActive,
      version: agencyGroup?.version as number,
    };

    const previousAgencyIds = new Set(groupAgencies.map((agency) => agency.id));
    const selectedAgencyIds = Array.from(new Set(result.data.agencies ?? []));
    const selectedAgencyIdSet = new Set(selectedAgencyIds);
    const agenciesById = new Map(
      allAgencies.map((agency) => [agency.id, agency])
    );
    const membershipUpdates: Array<{
      agency: Agency;
      agencyGroupIds: string[];
    }> = [];
    const affectedAgencyGroupIds = new Set<string>([agencyGroupId]);

    for (const selectedAgencyId of selectedAgencyIds) {
      if (previousAgencyIds.has(selectedAgencyId)) continue;
      const agency = agenciesById.get(selectedAgencyId);
      if (!agency) continue;
      const nextGroupIds = Array.from(
        new Set([...(agency.agencyGroupIds ?? []), agencyGroupId])
      );
      nextGroupIds.forEach((id) => affectedAgencyGroupIds.add(id));
      membershipUpdates.push({ agency, agencyGroupIds: nextGroupIds });
    }

    for (const agency of groupAgencies) {
      if (selectedAgencyIdSet.has(agency.id)) continue;
      const nextGroupIds = (agency.agencyGroupIds ?? []).filter(
        (id) => id !== agencyGroupId
      );
      if (nextGroupIds.length === 0) {
        setSchemaError(
          i18n.t("validation.agencyMustHaveAtLeastOneGroup", {
            ns: "admin",
            name: agency.name,
          })
        );
        scrollToSection("agencies");
        return;
      }
      nextGroupIds.forEach((id) => affectedAgencyGroupIds.add(id));
      membershipUpdates.push({ agency, agencyGroupIds: nextGroupIds });
    }

    try {
      const data = await updateAgencyGroup({
        payload: groupPayload,
        agencyGroupId,
      });

      if (membershipUpdates.length > 0) {
        await updateAgencyMemberships({
          updates: membershipUpdates,
          affectedAgencyGroupIds: Array.from(affectedAgencyGroupIds),
        });
      }

      setSchemaError(undefined);
      setAgencyGroupStatusActive(data.isActive ?? groupPayload.isActive);

      if (agencyGroupId) {
        queryClient.setQueryData<AgencyGroup>(
          ["agency-group", agencyGroupId],
          (prev) =>
            prev
              ? {
                  ...prev,
                  name: groupPayload.name,
                  description: groupPayload.description,
                  isActive: groupPayload.isActive,
                  numberOfAgencies: selectedAgencyIds.length,
                  version: data.version,
                }
              : {
                  id: agencyGroupId,
                  name: groupPayload.name,
                  description: groupPayload.description,
                  isActive: groupPayload.isActive,
                  numberOfAgencies: selectedAgencyIds.length,
                  version: data.version,
                }
        );
      }

      if (draftKey) clearDraft(draftKey);

      reset({
        name: data.name ?? "",
        description: data.description ?? "",
        agencies: selectedAgencyIds,
      });
      toast.success(
        i18n.t("modals.agencyGroupUpdatedSuccess", { ns: "admin" })
      );
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          i18n.t("errors.failedToUpdateAgencyGroup", { ns: "admin" })
        )
      );
    }
  };

  const onStatusChange = (checked: boolean) => {
    if (!checked && groupAgencies.some((a) => a.isActive)) {
      setBlockedDialogOpen(true);
      return;
    }
    setPendingStatusChange(checked);
  };

  const blockedStatusDialog = {
    open: blockedDialogOpen,
    onOpenChange: setBlockedDialogOpen,
    title: t("modals.reassignAgenciesFirst"),
    description: t("modals.reassignAgenciesFirstDescription"),
  };

  const statusConfirmDialog = {
    open: pendingStatusChange !== null,
    onOpenChange: (open: boolean) => !open && setPendingStatusChange(null),
    title:
      pendingStatusChange === false
        ? t("modals.confirmDeactivateAgencyGroup")
        : t("modals.confirmReactivateAgencyGroup"),
    description:
      pendingStatusChange === false
        ? t("modals.confirmDeactivateAgencyGroupDescription")
        : t("modals.confirmReactivateAgencyGroupDescription"),
    confirmLabel:
      pendingStatusChange === false
        ? t("buttons.deactivateAgencyGroup")
        : t("buttons.reactivate"),
    isPending: isToggling,
    onConfirm: () => {
      if (pendingStatusChange === null || !agencyGroupId) return;
      toggleStatus(
        { agencyGroupId, active: pendingStatusChange },
        { onSuccess: () => setPendingStatusChange(null) }
      );
    },
    confirmVariant:
      pendingStatusChange === false
        ? ("destructive" as const)
        : ("default" as const),
  };

  const title = agencyGroup?.name ?? "Agency Group";

  return {
    agencyGroupId,
    redirectPath,
    agencyGroup,
    isLoading,
    error,
    form,
    isPending,
    schemaError,
    activeSectionId,
    onSectionClick,
    sections: AGENCY_GROUP_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "agency-group-detail-form",
    title,
    submitButtonLabel: "Save",
    showActiveToggle: true as const,
    isActive: agencyGroupStatusActive,
    onStatusChange,
    statusConfirmDialog,
    blockedStatusDialog,
    isTogglingStatus: isToggling,
    draftKey: draftKey ?? undefined,
  };
}
