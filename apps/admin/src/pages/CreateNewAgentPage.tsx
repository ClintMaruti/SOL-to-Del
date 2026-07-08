import { useAgencies } from "@/entities/agency/api/useAgencies";
import { useCreateNewAgentPage } from "@/features/create-agent/model/useCreateNewAgentPage";
import { AgentForm } from "@/widgets/agent-form";

export function CreateNewAgentPage() {
  const { data: agencies = [] } = useAgencies();
  const props = useCreateNewAgentPage();

  const agencyOptions =
    agencies?.map((a) => ({ id: a.id, name: a.name })) ?? [];

  return (
    <AgentForm
      formData={props.formData}
      errors={props.errors}
      updateField={props.updateField}
      isPending={props.isPending}
      activeSectionId={props.activeSectionId}
      sections={props.sections}
      formId={props.formId}
      title={props.title}
      submitButtonLabel={props.submitButtonLabel}
      description={props.description}
      handleCancel={props.handleCancel}
      handleSubmit={props.handleSubmit}
      agencies={agencyOptions}
      unsavedDialogOpen={props.unsavedDialogOpen}
      handleUnsavedDiscard={props.handleUnsavedDiscard}
      handleUnsavedStay={props.handleUnsavedStay}
      onSectionClick={props.onSectionClick}
    />
  );
}
