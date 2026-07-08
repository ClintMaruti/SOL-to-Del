import { getErrorMessage } from "@sol/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { type Commission, useAgencyCommissions } from "@/entities/commission";
import { DeleteCommissionDialog } from "@/features/delete-commission";
import { CommissionModal } from "@/features/manage-commission";
import { TableLoadingSkeleton } from "@/shared/ui";

import { CommissionsTable } from "./CommissionsTable";

interface CommissionsCardProps {
  agencyId?: string | null;
}

export function CommissionsCard({ agencyId }: CommissionsCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(
    null
  );
  const [commissionToDelete, setCommissionToDelete] =
    useState<Commission | null>(null);
  const {
    data: commissions = [],
    isLoading,
    error,
  } = useAgencyCommissions(agencyId);

  return (
    <Card id="commission">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base font-bold text-text-primary leading-6">
              {t("sections.commission")}
            </CardTitle>
            <p className="text-sm font-medium text-text-secondary leading-6">
              {t("sections.commissionDescription")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="gap-1!"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            {t("common:buttons.create")}
          </Button>
        </div>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <TableLoadingSkeleton columns={["43", "43", "14"]} rows={3} />
        </CardContent>
      ) : null}

      {!isLoading && error ? (
        <CardContent>
          <p className="text-sm font-medium text-destructive">
            {getErrorMessage(error, t("errors.failedToLoadCommissions"))}
          </p>
        </CardContent>
      ) : null}

      {!isLoading && !error && commissions.length > 0 ? (
        <CardContent>
          <CommissionsTable
            commissions={commissions}
            onEditCommission={setEditingCommission}
            onDeleteCommission={setCommissionToDelete}
          />
        </CardContent>
      ) : null}

      {agencyId && createModalOpen ? (
        <CommissionModal
          agencyId={agencyId}
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />
      ) : null}

      {agencyId && editingCommission ? (
        <CommissionModal
          agencyId={agencyId}
          commission={editingCommission}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingCommission(null);
            }
          }}
        />
      ) : null}

      {commissionToDelete ? (
        <DeleteCommissionDialog
          commission={commissionToDelete}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCommissionToDelete(null);
            }
          }}
        />
      ) : null}
    </Card>
  );
}
