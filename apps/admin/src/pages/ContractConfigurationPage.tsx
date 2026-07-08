import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sol/ui";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { getSupplierContractAgencyGroupDisplayName } from "@/entities/supplier-contract";
import {
  ContractDetailsCard,
  ContractConfigurationSkeleton,
  useContractDetailPage,
} from "@/features/edit-supplier-contract";
import { generateRoutePath } from "@/shared/lib";
import { supplierDetailPath } from "@/shared/lib/paths";
import {
  ConfigurationImpactWarningDialog,
  ConfirmDeleteDialog,
  FORM_PAGE_FOOTER_HEIGHT,
  FormPageActionButtons,
  ResourceNotFound,
  UnsavedChangesDialog,
} from "@/shared/ui";
import { PoliciesCard } from "@/widgets/contract-policies";

export function ContractConfigurationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useContractDetailPage();

  const suppliersPath = generateRoutePath(
    "database",
    "destinations",
    "suppliers"
  );
  const supplierPath = props.supplierId
    ? supplierDetailPath(props.supplierId)
    : "";
  const contractsPath = `${supplierPath}?tab=contracts`;

  if (props.isLoading) {
    return <ContractConfigurationSkeleton />;
  }

  if (props.error || !props.contract) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.contract")}
          description={t("notFound.contractDescription")}
          actionLabel={t("buttons.backToSuppliers")}
          onAction={() => navigate(suppliersPath)}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col p-6 pt-2"
        style={{
          paddingBottom: `calc(1.5rem + ${FORM_PAGE_FOOTER_HEIGHT}px)`,
        }}
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
                  to={contractsPath}
                >
                  {props.supplier?.name ?? "..."}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-neutral-900 text-sm font-medium">
                {props.title}
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
            <p className="text-sm text-muted-foreground leading-6">
              {t("contractDetail.subtitle")}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <FormPageActionButtons
              formId={props.formId}
              submitButtonLabel={props.submitButtonLabel}
              isPending={props.isPending}
              onCancel={props.handleCancel}
              onDelete={undefined}
              isDeletePending={props.isDeletePending}
            />
          </div>
        </div>

        <form
          id={props.formId}
          onSubmit={props.handleSubmit}
          className="pt-6 space-y-4"
        >
          <ContractDetailsCard
            form={props.form}
            schemaError={props.schemaError}
            agencyGroupId={props.contract.agencyGroupId}
            agencyGroupLabel={getSupplierContractAgencyGroupDisplayName(
              props.contract
            )}
          />
        </form>

        <div className="pt-4">
          <PoliciesCard
            supplierId={props.supplierId!}
            contractId={props.contractId!}
            contractValidFrom={props.contract.validFrom}
            contractValidTo={props.contract.validTo}
            onDirtyChange={props.handlePoliciesDirtyChange}
          />
        </div>
      </div>

      {/* Fixed footer */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background"
        aria-label={t("common:aria.formActions", {
          defaultValue: "Form actions",
        })}
      >
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <FormPageActionButtons
            formId={props.formId}
            submitButtonLabel={props.submitButtonLabel}
            isPending={props.isPending}
            onCancel={props.handleCancel}
            onDelete={undefined}
            isDeletePending={props.isDeletePending}
          />
        </div>
      </footer>

      {/* Unsaved changes dialog */}
      <UnsavedChangesDialog
        open={props.unsavedDialogOpen}
        onOpenChange={(open) => !open && props.handleUnsavedStay()}
        onStay={props.handleUnsavedStay}
        onDiscard={props.handleUnsavedDiscard}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        open={props.deleteDialogOpen}
        onOpenChange={props.handleDeleteDialogClose}
        title={t("modals.confirmDeleteContract")}
        description={t("modals.confirmDeleteContractDescription")}
        confirmLabel={t("common:buttons.delete")}
        isPending={props.isDeletePending}
        onConfirm={props.handleDeleteConfirm}
      />

      {/* Configuration impact warning (when validity dates change) */}
      <ConfigurationImpactWarningDialog
        open={props.validityWarningOpen}
        onOpenChange={(open) => !open && props.handleValidityWarningCancel()}
        onConfirm={props.handleValidityWarningConfirm}
        onCancel={props.handleValidityWarningCancel}
        isPending={props.isPending}
      />
    </>
  );
}
