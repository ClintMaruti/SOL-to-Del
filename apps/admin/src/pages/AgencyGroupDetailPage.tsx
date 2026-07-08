import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAgencyGroupDetailPage } from "@/features/edit-agency-group";
import { ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";
import {
  AgencyGroupForm,
  AgencyGroupDetailSkeleton,
} from "@/widgets/agency-group-form";

export function AgencyGroupDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useAgencyGroupDetailPage();

  if (props.isLoading) {
    return <AgencyGroupDetailSkeleton />;
  }

  if (props.error || !props.agencyGroup) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.agencyGroup")}
          description={t("notFound.agencyGroupDescription")}
          actionLabel={t("buttons.backToAgencyGroups")}
          onAction={() => navigate(ROUTES.AGENCY_GROUPS)}
        />
      </div>
    );
  }

  return <AgencyGroupForm {...props} mode="edit" />;
}
