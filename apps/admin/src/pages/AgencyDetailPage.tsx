import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAgencyDetailPage } from "@/features/edit-agency/model/useAgencyDetailPage";
import { ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";
import { AgencyForm, AgencyDetailSkeleton } from "@/widgets/agency-form";

export function AgencyDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useAgencyDetailPage();

  if (props.isLoading) {
    return <AgencyDetailSkeleton />;
  }

  if (props.error || !props.agency) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.agency")}
          description={t("notFound.agencyDescription")}
          actionLabel={t("buttons.backToAgencies")}
          onAction={() => navigate(ROUTES.AGENCIES)}
        />
      </div>
    );
  }

  return <AgencyForm mode="edit" {...props} agencyId={props.agency.id} />;
}
