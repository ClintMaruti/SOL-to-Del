import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useToggleAgencyStatus } from "@/entities/agency/api/useToggleAgencyStatus";
import type { Agency } from "@/entities/agency/model/types";
import { hasSupplierXeroId } from "@/shared/lib/supplierXeroId";
import { DeleteAgencyDialog } from "@/features/delete-agency";
import { useOpenStateWithCleanupOnClose } from "@/shared/hooks";
import { ROUTES } from "@/shared/lib/paths";
import { AgencyList } from "@/widgets/agency-list";

export function AgenciesPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { innerPageId } = useParams<{ innerPageId?: string }>();
  const [searchParams] = useSearchParams();
  const agencyGroupId = searchParams.get("agencyGroupId");
  const { mutate: toggleStatus } = useToggleAgencyStatus();
  const navigate = useNavigate();

  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useOpenStateWithCleanupOnClose(false, () => setAgencyToDelete(null));

  // Show main agencies content when innerPageId is "agencies" or undefined
  const showMainContent = !innerPageId || innerPageId === "agencies";

  const handleToggleStatus = (agency: Agency, checked: boolean) => {
    if (checked && !hasSupplierXeroId(agency.kenXeroId)) {
      return;
    }
    toggleStatus({
      agencyId: agency.id,
      activate: checked,
    });
  };

  const handleDelete = (agency: Agency) => {
    setAgencyToDelete(agency);
    setDeleteDialogOpen(true);
  };

  const handleCreateAgency = () => {
    navigate(ROUTES.AGENCIES_CREATE);
  };

  return (
    <div className="p-4">
      {showMainContent ? (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="leading-10 text-neutral-900">
                {t("admin:pages.agencies")}
              </h1>
              <p className="max-w-2xl leading-6 text-neutral-600 text-sm font-medium">
                {t("admin:pages.agenciesDescription")}
              </p>
            </div>
            <Button
              onClick={handleCreateAgency}
              variant="primary"
              className="shrink-0"
            >
              <Plus />
              {t("common:buttons.create")}
            </Button>
          </div>

          <AgencyList
            agencyGroupId={agencyGroupId}
            onCreateAgency={handleCreateAgency}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />

          <DeleteAgencyDialog
            agency={agencyToDelete}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      ) : (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t("admin:pages.innerPage", { id: innerPageId })}
          </h2>
        </div>
      )}
    </div>
  );
}
