import { Switch } from "@sol/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useHeadOfficeDetailPage } from "@/features/edit-supplier-head-office";
import { ROUTES } from "@/shared/lib/paths";
import { ConfirmDialog, ResourceNotFound } from "@/shared/ui";
import {
  SupplierHeadOfficeForm,
  SupplierHeadOfficeDetailSkeleton,
} from "@/widgets/supplier-head-office-form";

const HEAD_OFFICES_LIST_PATH = ROUTES.SUPPLIER_HEAD_OFFICES;

export function SupplierHeadOfficeDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useHeadOfficeDetailPage();

  if (props.isLoading) {
    return <SupplierHeadOfficeDetailSkeleton />;
  }

  if (props.error || !props.headOffice) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.headOffice")}
          description={t("notFound.headOfficeDescription")}
          actionLabel={t("buttons.backToHeadOffices")}
          onAction={() => navigate(HEAD_OFFICES_LIST_PATH)}
        />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog {...props.toggleConfirmDialog} />
      <SupplierHeadOfficeForm
        mode="edit"
        headOfficeId={props.headOfficeId}
        form={props.form}
        schemaError={props.schemaError}
        isPending={props.isPending}
        activeSectionId={props.activeSectionId}
        onSectionClick={props.onSectionClick}
        sections={props.sections}
        unsavedDialogOpen={props.unsavedDialogOpen}
        handleCancel={props.handleCancel}
        handleSubmit={props.handleSubmit}
        handleUnsavedDiscard={props.handleUnsavedDiscard}
        handleUnsavedStay={props.handleUnsavedStay}
        formId={props.formId}
        title={props.title}
        submitButtonLabel={props.submitButtonLabel}
        description={props.description}
        headerExtra={
          props.showActiveToggle ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Active
              </span>
              <Switch
                checked={props.headOfficeStatusActive}
                onCheckedChange={props.handleToggleHeadOfficeStatus}
                aria-label={`Toggle ${props.title} active status`}
              />
            </div>
          ) : undefined
        }
        suppliers={props.suppliers}
        onSupplierNameClick={props.onSupplierNameClick}
        onToggleSupplierStatus={props.onToggleSupplierStatus}
        onDeleteSupplier={props.onDeleteSupplier}
        canDelete={props.canDelete}
        isDeletePending={props.isDeletePending}
        deleteError={props.deleteError}
        resetDeleteError={props.resetDeleteError}
      />
    </>
  );
}
