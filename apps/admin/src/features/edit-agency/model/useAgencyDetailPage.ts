import { useStore } from "@tanstack/react-form";
import { getErrorMessage, getValidationErrors } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAgency } from "@/entities/agency/api/useAgency";
import { useUpdateAgency } from "@/entities/agency/api/useUpdateAgency";
import { useAgents } from "@/entities/agent/api/useAgents";
import { useSourceMarkets } from "@/entities/source-market/api/useSourceMarkets";
import { formDataToUpdateAgencyPayload } from "@/features/create-agency/api/formDataToCreateAgencyRequest";
import { agencyDetailToFormData } from "@/features/create-agency/lib/agencyDetailToFormData";
import { applyAgencyApiValidationErrors } from "@/features/create-agency/model/agencyApiValidationErrors";
import { agencySubmitSchema } from "@/features/create-agency/model/schema";
import { useCreateAgencyForm } from "@/features/create-agency/model/useCreateAgencyForm";
import { getFirstSectionWithError } from "@/features/create-agency/model/useCreateNewAgencyPage";
import {
  useActiveSection,
  useOpenStateWithCleanupOnClose,
  useUnsavedChangesBlocker,
} from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import {
  clearFormScopedOnSubmitFieldErrors,
  getFieldNamesFromZodError,
  safeParseSubmitData,
} from "@/shared/lib/form";
import { hasSupplierXeroId } from "@/shared/lib/supplierXeroId";
import { ROUTES, agentDetailPath } from "@/shared/lib/paths";
import { AGENCY_FORM_ANCHOR_SECTIONS, type Agent } from "@/widgets/agency-form";

const SECTION_IDS = AGENCY_FORM_ANCHOR_SECTIONS.map((s) => s.id);
const AGENCIES_LIST_PATH = ROUTES.AGENCIES;

export function useAgencyDetailPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
  const [createAgentModalOpen, setCreateAgentModalOpen] =
    useOpenStateWithCleanupOnClose(false, () => setAgentToEdit(null));
  const [schemaError, setSchemaError] = useState<string | undefined>();
  const [agencyStatusActive, setAgencyStatusActive] = useState(false);
  const {
    data: agency,
    isLoading: isAgencyLoading,
    error,
  } = useAgency(agencyId);
  const { data: allAgents = [] } = useAgents(agencyId ?? null);
  const { data: sourceMarkets = [], isLoading: isSourceMarketsLoading } =
    useSourceMarkets();

  const agentsForAgency = useMemo(
    () => (agencyId ? allAgents.filter((a) => a.agencyId === agencyId) : []),
    [agencyId, allAgents]
  );

  const baselineAgents = useMemo(
    () =>
      agency?.agents && agency.agents.length > 0
        ? agency.agents
        : agentsForAgency,
    [agency, agentsForAgency]
  );

  const agentsDirty = useMemo(() => {
    return agents.some((a) => {
      const baseline = baselineAgents.find((b) => b.id === a.id);
      return baseline != null && baseline.isActive !== a.isActive;
    });
  }, [agents, baselineAgents]);

  const isLoading = isAgencyLoading || isSourceMarketsLoading;

  const initialFormData = useMemo(
    () => (agency ? agencyDetailToFormData(agency, sourceMarkets) : null),
    [agency, sourceMarkets]
  );
  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useCreateAgencyForm(initialFormData, {
    dataRevision: agency?.version,
    entityKey: agencyId,
  });

  const { mutate: updateAgency, isPending } = useUpdateAgency();

  const kenXeroIdFromForm = useStore(
    form.store,
    (s) => (s.values as { kenXeroId?: string }).kenXeroId ?? ""
  );

  const agencyStatusDirty =
    agency != null && agencyStatusActive !== (agency.isActive ?? false);
  const isDirty = formIsDirty || agentsDirty || agencyStatusDirty;

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: AGENCIES_LIST_PATH,
    onPrepareDiscard: () => {
      reset(initialFormData ?? undefined, {
        dataRevision: agency?.version,
      });
      setAgencyStatusActive(agency?.isActive ?? false);
      const next =
        agency?.agents && agency.agents.length > 0
          ? agency.agents
          : agentsForAgency;
      setAgents(next ?? []);
    },
  });

  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [isLoading, onSectionClick]);

  // Sync local active status from agency when agency changes
  useEffect(() => {
    if (agency) {
      const token = setTimeout(
        () => setAgencyStatusActive(agency.isActive ?? false),
        0
      );
      return () => clearTimeout(token);
    }
  }, [agency?.id, agency?.isActive]); // eslint-disable-line react-hooks/exhaustive-deps -- only sync active status when agency changes

  // Reset form when switching agency or when source markets load
  useEffect(() => {
    if (!agency) return;
    const formData = agencyDetailToFormData(agency, sourceMarkets);
    reset(formData, { dataRevision: agency.version });
  }, [agency?.id, sourceMarkets]); // eslint-disable-line react-hooks/exhaustive-deps -- only reset form when agency or sourceMarkets change

  // Sync agents when switching agency or when agency/agents data becomes available (do not depend on sourceMarkets to avoid overwriting local adds/edits). Defer setState to avoid synchronous setState in effect.
  useEffect(() => {
    if (!agency) return;
    const nextAgents =
      agency.agents && agency.agents.length > 0
        ? agency.agents
        : agentsForAgency;
    const token = setTimeout(() => setAgents(nextAgents), 0);
    return () => clearTimeout(token);
  }, [agency?.id, agency?.agents, allAgents.length]); // eslint-disable-line react-hooks/exhaustive-deps -- agentsForAgency read from closure

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormScopedOnSubmitFieldErrors(form);
    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid || !agencyId) {
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

    const payload = formDataToUpdateAgencyPayload(
      result.data,
      agency?.version as number,
      agencyStatusActive,
      agency?.additionalNotes
    );
    updateAgency(
      { agencyId, payload },
      {
        onSuccess: (data) => {
          setSchemaError(undefined);
          if (data) {
            reset(agencyDetailToFormData(data, sourceMarkets), {
              dataRevision: data.version,
            });
            setAgencyStatusActive(data.isActive ?? false);
          }
          toast.success("Agency updated successfully");
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

          toast.error(
            getErrorMessage(
              err,
              i18n.t("errors.failedToUpdateAgency", { ns: "admin" })
            )
          );
        },
      }
    );
  };

  const toggleAgentActive = (agent: Agent, checked: boolean) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, isActive: checked } : a))
    );
  };

  const handleAgentNameClick = (agent: Agent) => {
    navigate(agentDetailPath(agent.id));
  };

  const handleToggleAgencyStatus = (checked: boolean) => {
    if (checked && !hasSupplierXeroId(kenXeroIdFromForm)) {
      return;
    }
    setAgencyStatusActive(checked);
  };

  const onAgentDeleted = (agent: Agent) => {
    setAgents((prev) => prev.filter((a) => a.id !== agent.id));
  };

  const editAgent = (agent: Agent) => {
    setAgentToEdit(agent ?? null);
    setCreateAgentModalOpen(true);
  };

  const onUpdateAgent = (agent: Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)));
    setAgentToEdit(null);
  };

  const displayName = agency?.name ?? "Agency";

  return {
    agencyId,
    agency,
    isLoading,
    error,
    form,
    schemaError,
    agents,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: AGENCY_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    toggleAgentActive,
    createAgentModalOpen,
    setCreateAgentModalOpen,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "agency-detail-form",
    title: displayName,
    submitButtonLabel: "Save",
    showActiveToggle: true,
    agencyStatusActive,
    handleToggleAgencyStatus,
    activationKenXeroId: kenXeroIdFromForm,
    handleAgentNameClick,
    onAgentDeleted,
    onUpdateAgent,
    agentToEdit,
    editAgent,
  };
}
