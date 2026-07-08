import { useCreateNewAgencyPage } from "@/features/create-agency/model/useCreateNewAgencyPage";
import { AgencyForm } from "@/widgets/agency-form";

export function CreateNewAgencyPage() {
  const props = useCreateNewAgencyPage();
  return <AgencyForm mode="create" {...props} />;
}
