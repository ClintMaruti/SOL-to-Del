import { useTranslation } from "react-i18next";

import { CreateNewAgentModal } from "@/features/create-agent";
import { ActiveStatusSwitchWithXeroGate, FormPageLayout } from "@/shared/ui";

import type { AgencyFormProps } from "../types";

import { AdditionalIdsCard } from "./AdditionalIdsCard";
import { AdditionalNotesCard } from "./AdditionalNotesCard";
import { AgencyAffiliationsCard } from "./AgencyAffiliationsCard";
import { AgentsCard } from "./AgentsCard";
import { AgentZoneCard } from "./AgentZoneCard";
import { CommissionsCard } from "./CommissionsCard";
import { ContactsAddressCard } from "./ContactsAddressCard";
import { GeneralInformationCard } from "./GeneralInformationCard";
import { PaymentTermsCard } from "./PaymentTermsCard";
import { WhiteLabelCard } from "./WhiteLabelCard";

export const AgencyForm: React.FC<AgencyFormProps> = ({
  form,
  schemaError,
  isPending,
  activeSectionId,
  onSectionClick,
  sections,
  unsavedDialogOpen,
  handleCancel,
  handleSubmit,
  handleUnsavedDiscard,
  handleUnsavedStay,
  agents,
  agencyId,
  agentToEdit,
  editAgent,
  onUpdateAgent,
  handleAgentNameClick,
  toggleAgentActive,
  onAgentDeleted,
  mode,
  formId,
  title,
  submitButtonLabel,
  description,
  createAgentModalOpen,
  setCreateAgentModalOpen,
  showActiveToggle,
  agencyStatusActive,
  handleToggleAgencyStatus,
  activationKenXeroId,
}) => {
  const { t } = useTranslation("admin");
  const visibleSections =
    mode === "edit"
      ? sections
      : sections.filter((section) => section.id !== "commission");

  return (
    <>
      <FormPageLayout
        title={title}
        description={description}
        formId={formId}
        submitButtonLabel={submitButtonLabel}
        isPending={isPending}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        sections={visibleSections}
        activeSectionId={activeSectionId}
        onSectionClick={onSectionClick}
        unsavedDialogOpen={unsavedDialogOpen}
        onUnsavedDiscard={handleUnsavedDiscard}
        onUnsavedStay={handleUnsavedStay}
        schemaError={schemaError}
        headerExtra={
          showActiveToggle ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground leading-none">
                {t("status.active")}
              </span>
              <ActiveStatusSwitchWithXeroGate
                variant="agency"
                xeroId={activationKenXeroId}
                checked={agencyStatusActive ?? false}
                onCheckedChange={(checked) =>
                  handleToggleAgencyStatus?.(checked)
                }
                ariaLabel={t("aria.toggleActiveStatus", { name: title })}
              />
            </div>
          ) : undefined
        }
      >
        <GeneralInformationCard form={form} />
        <ContactsAddressCard form={form} />
        <PaymentTermsCard form={form} />

        {mode === "edit" && agencyId ? (
          <CommissionsCard agencyId={agencyId} />
        ) : null}

        <AgentsCard
          agents={agents}
          agencyId={agencyId}
          onAgentNameClick={handleAgentNameClick}
          onToggleActive={toggleAgentActive}
          onEdit={editAgent}
          onAgentDeleted={onAgentDeleted}
        />

        <div id="other">
          <WhiteLabelCard form={form} />
          <AgentZoneCard form={form} />
          <AgencyAffiliationsCard form={form} />
          <AdditionalIdsCard form={form} />
          <AdditionalNotesCard form={form} />
        </div>
      </FormPageLayout>

      {mode === "edit" &&
        createAgentModalOpen &&
        agentToEdit != null &&
        editAgent && (
          <CreateNewAgentModal
            open={createAgentModalOpen}
            onOpenChange={setCreateAgentModalOpen}
            onAgentUpdated={onUpdateAgent}
            agent={agentToEdit}
            agencyId={agencyId}
          />
        )}
    </>
  );
};
