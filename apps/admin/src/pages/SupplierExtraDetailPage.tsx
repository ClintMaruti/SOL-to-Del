import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Switch,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { useSupplier } from "@/entities/suppliers";
import { useExtraDetailPage } from "@/features/edit-extra/model/useExtraDetailPage";
import { generateRoutePath } from "@/shared/lib";
import {
  supplierDetailPath,
  supplierServiceDetailPath,
} from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { ConfirmDialog, FormPageLayout, ResourceNotFound } from "@/shared/ui";
import {
  ExtraContractedCard,
  ExtraGeneralInformationCard,
  ExtraNotesCard,
  SupplierExtraDetailSkeleton,
} from "@/widgets/extra-detail-form";

export function SupplierExtraDetailPage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const { supplierId, extraId } = useParams<{
    supplierId: string;
    extraId: string;
  }>();

  const {
    extra,
    isLoading,
    error,
    form,
    isPending,
    schemaError,
    activeSectionId,
    onSectionClick,
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    handleSubmit,
    handleToggleActive,
    isServiceContext,
    contracts,
    zeroPriceConfirmOpen,
    onZeroPriceConfirmOpenChange,
    onZeroPriceConfirm,
  } = useExtraDetailPage({ supplierId, extraId });

  const { data: supplier } = useSupplier(supplierId);

  const { extrasStatus } = useLoadingStates(
    useShallow((state) => ({ extrasStatus: state.extrasStatus }))
  );

  const displayTitle = useStore(
    form.store,
    (s) => s.values.title?.trim() || ""
  );

  const sections = useMemo(
    () => [
      {
        id: "extra-general-information",
        label: t("extraDetail.sections.general"),
      },
      {
        id: "extra-contracted-extra",
        label: t("extraDetail.sections.contractedExtra"),
      },
      { id: "extra-notes", label: t("extraDetail.sections.notes") },
    ],
    [t]
  );

  const suppliersPath = generateRoutePath(
    "database",
    "destinations",
    "suppliers"
  );
  const supplierPath = supplierDetailPath(supplierId ?? "");
  const servicesPath = `${supplierPath}?tab=services`;

  if (isLoading || !supplierId || !extraId) {
    return <SupplierExtraDetailSkeleton />;
  }

  const backToSupplierExtras = () => {
    if (supplierId) {
      navigate(`${supplierDetailPath(supplierId)}?tab=extras`);
    } else {
      navigate(suppliersPath);
    }
  };

  if (error || !extra) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("extraDetail.notFound.title")}
          description={t("extraDetail.notFound.description")}
          actionLabel={t("extraDetail.notFound.action")}
          onAction={backToSupplierExtras}
        />
      </div>
    );
  }

  if (extra.supplierId !== undefined && extra.supplierId !== supplierId) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("extraDetail.notFound.title")}
          description={t("extraDetail.notFound.description")}
          actionLabel={t("extraDetail.notFound.action")}
          onAction={backToSupplierExtras}
        />
      </div>
    );
  }

  const extrasTabHref =
    isServiceContext && extra.serviceId
      ? `${supplierServiceDetailPath(supplierId, extra.serviceId)}?tab=extras`
      : `${supplierPath}?tab=extras`;

  const pageTitle = displayTitle || extra.title;

  return (
    <>
      <div className="flex flex-col pt-2">
        <Breadcrumb className="px-6 py-1.5">
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
                  {supplier?.name ?? "…"}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {isServiceContext && extra.serviceId ? (
              <>
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
                  <BreadcrumbLink asChild>
                    <Link
                      className="text-blue-500 text-sm font-medium"
                      to={`${supplierServiceDetailPath(
                        supplierId,
                        extra.serviceId
                      )}?tab=extras`}
                    >
                      {extra.serviceName ?? "…"}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            ) : null}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  className="text-blue-500 text-sm font-medium"
                  to={extrasTabHref}
                >
                  {t("sections.extras")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-neutral-900 text-sm font-medium">
                {pageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <FormPageLayout
          title={pageTitle}
          formId="edit-extra-form"
          submitButtonLabel={t("buttons.save")}
          isPending={isPending}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionClick={onSectionClick}
          unsavedDialogOpen={showUnsavedDialog}
          onUnsavedDiscard={handleUnsavedDiscard}
          onUnsavedStay={handleUnsavedStay}
          schemaError={schemaError}
          headerExtra={
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {t("labels.status")}
              </span>
              <Switch
                checked={extra.isActive}
                onCheckedChange={handleToggleActive}
                loading={extrasStatus[extra.id]}
                aria-label={t("aria.extraActiveStatus", {
                  title: extra.title,
                })}
                size="sm"
              />
            </div>
          }
        >
          <ExtraGeneralInformationCard
            form={form}
            supplierId={supplierId}
            scopedServiceId={isServiceContext ? extra.serviceId : undefined}
          />
          <ExtraContractedCard form={form} contracts={contracts} />
          <ExtraNotesCard form={form} />
        </FormPageLayout>

        <ConfirmDialog
          open={zeroPriceConfirmOpen}
          onOpenChange={onZeroPriceConfirmOpenChange}
          title={t("extraDetail.zeroPriceConfirm")}
          description={t("extraDetail.zeroPriceConfirmDescription")}
          confirmLabel={t("buttons.save")}
          isPending={isPending}
          onConfirm={onZeroPriceConfirm}
        />
      </div>
    </>
  );
}
