import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office";
import { useToggleSupplierHeadOfficeStatus } from "@/entities/supplier-head-office/api/useToggleSupplierHeadOfficeStatus";
import { DeleteSupplierHeadOfficeDialog } from "@/features/delete-supplier-head-office";
import { useOpenStateWithCleanupOnClose } from "@/shared/hooks";
import { ROUTES } from "@/shared/lib/paths";
import { ConfirmDialog } from "@/shared/ui";
import { SupplierHeadOfficesList } from "@/widgets/supplier-head-offices-list/ui/SupplierHeadOfficesList";

const CREATE_HEAD_OFFICE_PATH = ROUTES.SUPPLIER_HEAD_OFFICES_CREATE;

export function SupplierHeadOfficePage() {
  const { t } = useTranslation(["admin", "common"]);
  const navigate = useNavigate();
  const { innerPageId } = useParams<{ innerPageId?: string }>();
  const [supplierHeadOfficeToDelete, setSupplierHeadOfficeToDelete] =
    useState<SupplierHeadOffice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useOpenStateWithCleanupOnClose(false, () =>
      setSupplierHeadOfficeToDelete(null)
    );
  const [headOfficeToToggle, setHeadOfficeToToggle] = useState<{
    headOffice: SupplierHeadOffice;
    isActive: boolean;
  } | null>(null);

  const { mutate: toggleSupplierHeadOfficeStatus, isPending: isToggling } =
    useToggleSupplierHeadOfficeStatus();

  // Show main content when innerPageId is "supplier-head-offices" or undefined
  const showMainContent =
    !innerPageId || innerPageId === "supplier-head-offices";

  const handleCreateSupplierHeadOffice = () => {
    navigate(CREATE_HEAD_OFFICE_PATH);
  };

  const handleDelete = (supplierHeadOffice: SupplierHeadOffice) => {
    setSupplierHeadOfficeToDelete(supplierHeadOffice);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = (
    supplierHeadOffice: SupplierHeadOffice,
    isActive: boolean
  ) => {
    setHeadOfficeToToggle({ headOffice: supplierHeadOffice, isActive });
  };

  const handleDuplicateSupplierHeadOffice = (
    supplierHeadOffice: SupplierHeadOffice
  ) => {
    navigate(CREATE_HEAD_OFFICE_PATH, {
      state: { duplicateFrom: supplierHeadOffice },
    });
  };

  return (
    <div className="p-4">
      {showMainContent ? (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="leading-10 text-neutral-900 text-2xl">
                {t("sidebar.headOffices")}
              </h1>
              <p className="max-w-[650px] leading-6 text-neutral-600 text-sm font-medium">
                {t("pageTitles.headOfficesDescription")}
              </p>
            </div>
            <Button
              onClick={handleCreateSupplierHeadOffice}
              variant="primary"
              className="shrink-0 px-4 py-2"
            >
              <Plus />
              {t("common:buttons.create")}
            </Button>
          </div>

          <SupplierHeadOfficesList
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onCreateSupplierHeadOffice={handleCreateSupplierHeadOffice}
            onDuplicateSupplierHeadOffice={handleDuplicateSupplierHeadOffice}
          />

          <ConfirmDialog
            open={!!headOfficeToToggle}
            onOpenChange={(open) => !open && setHeadOfficeToToggle(null)}
            title={
              headOfficeToToggle?.isActive
                ? t("modals.confirmDeactivateHeadOffice")
                : t("modals.confirmActivateHeadOffice")
            }
            description={
              headOfficeToToggle?.isActive
                ? t("modals.confirmDeactivateHeadOfficeDescription")
                : t("modals.confirmActivateHeadOfficeDescription")
            }
            confirmLabel={
              headOfficeToToggle?.isActive
                ? t("buttons.deactivate")
                : t("buttons.activate")
            }
            isPending={isToggling}
            onConfirm={() => {
              if (!headOfficeToToggle) return;
              toggleSupplierHeadOfficeStatus(
                {
                  supplierHeadOfficeId: headOfficeToToggle.headOffice.id,
                  isActive: headOfficeToToggle.isActive,
                },
                { onSuccess: () => setHeadOfficeToToggle(null) }
              );
            }}
          />

          {supplierHeadOfficeToDelete && (
            <DeleteSupplierHeadOfficeDialog
              supplierHeadOffice={supplierHeadOfficeToDelete}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            />
          )}
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
