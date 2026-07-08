import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useToggleAgencyGroupStatus } from "@/entities/agency-group";
import type { AgencyGroup } from "@/entities/agency-group/model/types";
import { DeleteAgencyGroupDialog } from "@/features/delete-agency-group";
import { ROUTES } from "@/shared/lib/paths";
import { BlockedActionDialog, ConfirmDialog } from "@/shared/ui";
import { AgencyGroupsList } from "@/widgets/agency-groups-list";

type GroupToToggle = { group: AgencyGroup; active: boolean };

export function AgencyGroupsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["admin", "common"]);
  const { mutate: toggleStatus, isPending: isToggling } =
    useToggleAgencyGroupStatus();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyGroupToDelete, setAgencyGroupToDelete] =
    useState<AgencyGroup | null>(null);
  const [groupToToggle, setGroupToToggle] = useState<GroupToToggle | null>(
    null
  );
  const [blockedGroup, setBlockedGroup] = useState<AgencyGroup | null>(null);

  const handleToggleActive = (group: AgencyGroup, active: boolean) => {
    if (!active && group.numberOfAgencies > 0) {
      setBlockedGroup(group);
      return;
    }
    setGroupToToggle({ group, active });
  };

  const handleDelete = (group: AgencyGroup) => {
    setAgencyGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleCreateAgencyGroup = () => {
    navigate(ROUTES.AGENCY_GROUPS_CREATE);
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="leading-10 text-text-primary font-bold text-2xl">
            {t("admin:sidebar.agencyGroups")}
          </h1>
          <p className="max-w-2xl leading-6 text-text-secondary text-sm font-medium">
            {t("admin:pages.agencyGroupsDescription")}
          </p>
        </div>
        <Button
          onClick={handleCreateAgencyGroup}
          variant="primary"
          className="shrink-0"
        >
          <Plus />
          {t("common:buttons.create")}
        </Button>
      </div>

      <BlockedActionDialog
        open={!!blockedGroup}
        onOpenChange={(open) => !open && setBlockedGroup(null)}
        title={t("admin:modals.reassignAgenciesFirst")}
        description={t("admin:modals.reassignAgenciesFirstDescription")}
      />

      <ConfirmDialog
        open={!!groupToToggle}
        onOpenChange={(open) => !open && setGroupToToggle(null)}
        title={
          groupToToggle?.active === false
            ? t("admin:modals.confirmDeactivateAgencyGroup")
            : t("admin:modals.confirmReactivateAgencyGroup")
        }
        description={
          groupToToggle?.active === false
            ? t("admin:modals.confirmDeactivateAgencyGroupDescription")
            : t("admin:modals.confirmReactivateAgencyGroupDescription")
        }
        confirmLabel={
          groupToToggle?.active === false
            ? t("admin:buttons.deactivateAgencyGroup")
            : t("admin:buttons.reactivate")
        }
        confirmVariant={groupToToggle?.active === false ? "danger" : "primary"}
        isPending={isToggling}
        onConfirm={() => {
          if (!groupToToggle) return;
          toggleStatus(
            {
              agencyGroupId: groupToToggle.group.id,
              active: groupToToggle.active,
            },
            { onSuccess: () => setGroupToToggle(null) }
          );
        }}
      />

      <AgencyGroupsList
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onCreateAgencyGroup={handleCreateAgencyGroup}
      />

      <DeleteAgencyGroupDialog
        agencyGroup={agencyGroupToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
