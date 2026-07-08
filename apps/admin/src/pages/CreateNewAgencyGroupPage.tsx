import { useCreateNewAgencyGroupPage } from "@/features/create-agency-group/model/useCreateAgencyGroupPage";
import { AgencyGroupForm } from "@/widgets/agency-group-form";

export function CreateNewAgencyGroupPage() {
  const props = useCreateNewAgencyGroupPage();

  return <AgencyGroupForm {...props} mode="create" />;
}
