import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Switch,
} from "@sol/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useSupplier } from "@/entities/suppliers";
import {
  useSupplierServiceDetailPage,
  useSupplierServiceDetailTabs,
} from "@/features/edit-supplier-service";
import { SupplierServiceNotesActions } from "@/features/edit-supplier-service/ui/SupplierServiceNotesActions";
import { SupplierServiceNotesTab } from "@/features/edit-supplier-service/ui/SupplierServiceNotesTab";
import {
  generateRoutePath,
  supplierServiceRatesDetailSearch,
} from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import {
  FORM_PAGE_FOOTER_HEIGHT,
  FormPageActionButtons,
  ResourceNotFound,
  UnsavedChangesDialog,
} from "@/shared/ui";
import { RatePlanSection } from "@/widgets/service-option-rate-plans-section";
import {
  ServiceEligibilityTab,
  type ServiceEligibilityTabActions,
} from "@/widgets/service-eligibility-tab";
import { ServiceExtrasList } from "@/widgets/service-extras-list";
import { ServiceOptionsTab } from "@/widgets/service-options-tab";
import { ServiceRatesTab } from "@/widgets/service-rates-tab";
import {
  EditSupplierServiceForm,
  SupplierServiceDetailSkeleton,
} from "@/widgets/supplier-service-form";

export function SupplierServiceDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(["admin", "common"]);
  const [eligibilityActions, setEligibilityActions] =
    useState<ServiceEligibilityTabActions | null>(null);
  const { activeTab, tabBar } = useSupplierServiceDetailTabs();
  const props = useSupplierServiceDetailPage();
  const { data: supplier } = useSupplier(props.supplierId);
  const toggleLoading = useLoadingStates(
    (state) => state.supplierServicesStatus[props.serviceId ?? ""]
  );

  const suppliersPath = generateRoutePath(
    "database",
    "destinations",
    "suppliers"
  );
  const supplierPath = `${suppliersPath}/${props.supplierId ?? ""}`;
  const servicesPath = `${supplierPath}?tab=services`;

  const legacyRateId = searchParams.get("rateId");
  const legacyInnerTab = searchParams.get("innerTab");
  const legacyRatePlanId = searchParams.get("ratePlanId");
  const legacyContractId = searchParams.get("contractId");

  useEffect(() => {
    if (!props.supplierId || !props.serviceId || !legacyRateId) {
      return;
    }
    if (activeTab === "rates") {
      return;
    }
    if (legacyInnerTab === "ratePlan" || legacyRatePlanId) {
      return;
    }

    navigate(
      supplierServiceRatesDetailSearch(props.supplierId, props.serviceId, {
        rateId: legacyRateId,
        contractId: legacyContractId ?? undefined,
      }),
      { replace: true }
    );
  }, [
    activeTab,
    legacyContractId,
    legacyInnerTab,
    legacyRateId,
    legacyRatePlanId,
    navigate,
    props.serviceId,
    props.supplierId,
  ]);

  if (props.isLoading) {
    return <SupplierServiceDetailSkeleton />;
  }

  if (props.error || !props.supplierService) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.supplierService")}
          description={t("notFound.supplierServiceDescription")}
          actionLabel={t("buttons.backToSuppliers")}
          onAction={() =>
            navigate(generateRoutePath("database", "destinations", "suppliers"))
          }
        />
      </div>
    );
  }

  const isGeneral = activeTab === "general";
  const isOptions = activeTab === "options";
  const isRates = activeTab === "rates";
  const isRatePlan = activeTab === "ratePlan";
  const isEligibility = activeTab === "eligibility";
  const isExtras = activeTab === "extras";
  const isNotes = activeTab === "notes";
  const showNotesSaveFooter = isNotes;

  return (
    <>
      <div
        className="flex flex-col p-6 pt-2"
        style={
          isGeneral || showNotesSaveFooter
            ? {
                paddingBottom: `calc(1.5rem + ${FORM_PAGE_FOOTER_HEIGHT}px)`,
              }
            : undefined
        }
      >
        {/* Breadcrumb */}
        <Breadcrumb className="py-1.5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  className="text-blue-500 text-sm font-medium"
                  to={suppliersPath}
                >
                  {t("sidebar.suppliers")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  className="text-blue-500 text-sm font-medium"
                  to={supplierPath}
                >
                  {supplier?.name ?? "..."}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  className="text-blue-500 text-sm font-medium"
                  to={servicesPath}
                >
                  {t("sections.services")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-neutral-900 text-sm font-medium">
                {props.supplierService.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mt-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {props.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {props.showActiveToggle && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("status.active")}
                </span>
                <Switch
                  checked={props.serviceStatusActive}
                  onCheckedChange={props.handleToggleServiceStatus}
                  aria-label={`Toggle ${props.title} active status`}
                  loading={toggleLoading}
                />
              </div>
            )}
            {isGeneral && (
              <div className="flex justify-end gap-2">
                <FormPageActionButtons
                  formId={props.formId}
                  submitButtonLabel={props.submitButtonLabel}
                  isPending={props.isPending}
                  onCancel={props.handleCancel}
                />
              </div>
            )}
            {isNotes && (
              <div className="flex justify-end gap-2">
                <SupplierServiceNotesActions
                  submitButtonLabel={props.submitButtonLabel}
                  onCancel={props.handleCancel}
                  onSave={props.notes.save}
                  isPending={props.notes.isPending}
                  disableSave={!props.notes.isDirty}
                />
              </div>
            )}
            {isEligibility && eligibilityActions && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={eligibilityActions.onCancel}
                  disabled={eligibilityActions.isPending}
                >
                  {t("common:buttons.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={eligibilityActions.onSaveAndCreateNew}
                  isLoading={eligibilityActions.isPending}
                  disabled={eligibilityActions.disableSave}
                  className="border-brand-red text-brand-red hover:text-brand-red"
                >
                  {t("buttons.saveAndCreateNew")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={eligibilityActions.onSave}
                  isLoading={eligibilityActions.isPending}
                  disabled={eligibilityActions.disableSave}
                >
                  {eligibilityActions.submitButtonLabel}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-4">{tabBar}</div>

        {/* Tab content */}
        {isGeneral && (
          <EditSupplierServiceForm
            contentOnly
            form={props.form}
            supplierService={props.supplierService}
            schemaError={props.schemaError}
            isPending={props.isPending}
            activeSectionId={props.activeSectionId}
            sections={props.sections}
            unsavedDialogOpen={props.unsavedDialogOpen}
            handleCancel={props.handleCancel}
            handleSubmit={props.handleSubmit}
            handleUnsavedDiscard={props.handleUnsavedDiscard}
            handleUnsavedStay={props.handleUnsavedStay}
            formId={props.formId}
            title={props.title}
            submitButtonLabel={props.submitButtonLabel}
          />
        )}
        {isOptions && (
          <ServiceOptionsTab
            serviceId={props.serviceId ?? null}
            supplierId={props.supplierId ?? null}
          />
        )}
        {isRates && props.serviceId && props.supplierId && (
          <ServiceRatesTab
            serviceId={props.serviceId}
            supplierId={props.supplierId}
          />
        )}
        {isRatePlan && props.serviceId && (
          <RatePlanSection serviceId={props.serviceId} />
        )}
        {isEligibility && (
          <ServiceEligibilityTab
            serviceId={props.serviceId ?? null}
            supplierId={props.supplierId ?? null}
            serviceName={props.supplierService.name}
            onActionsChange={setEligibilityActions}
          />
        )}
        {isExtras && (
          <ServiceExtrasList
            supplierId={props.supplierId}
            serviceId={props.serviceId}
          />
        )}
        {isNotes && (
          <SupplierServiceNotesTab
            text={props.notes.text}
            onTextChange={props.notes.setText}
            disabled={props.notes.isLoading}
          />
        )}
        {!isGeneral &&
          !isOptions &&
          !isRates &&
          !isRatePlan &&
          !isEligibility &&
          !isExtras &&
          !isNotes && (
            <div className="flex min-h-[200px] items-center justify-center pt-6 text-muted-foreground">
              {t("empty.comingSoon")}
            </div>
          )}
      </div>

      {/* Fixed footer for general and notes tabs */}
      {(isGeneral || showNotesSaveFooter) && (
        <footer
          className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background"
          aria-label={t("common:aria.formActions", {
            defaultValue: "Form actions",
          })}
        >
          <div className="flex items-center justify-end gap-2 px-6 py-4">
            {isGeneral && (
              <FormPageActionButtons
                formId={props.formId}
                submitButtonLabel={props.submitButtonLabel}
                isPending={props.isPending}
                onCancel={props.handleCancel}
              />
            )}
            {isNotes && (
              <SupplierServiceNotesActions
                submitButtonLabel={props.submitButtonLabel}
                onCancel={props.handleCancel}
                onSave={props.notes.save}
                isPending={props.notes.isPending}
                disableSave={!props.notes.isDirty}
              />
            )}
          </div>
        </footer>
      )}

      {/* Unsaved changes dialog at page level */}
      <UnsavedChangesDialog
        open={props.unsavedDialogOpen}
        onOpenChange={(open) => !open && props.handleUnsavedStay()}
        onStay={props.handleUnsavedStay}
        onDiscard={props.handleUnsavedDiscard}
      />
    </>
  );
}
