import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { type SupplierDetail } from "@/entities/suppliers";
import {
  useSupplierData,
  useSupplierNotesTab,
  useSupplierOverviewTab,
} from "@/features/edit-supplier";
import { ROUTES } from "@/shared/lib/paths";
import { type AnyFormApi, ResourceNotFound } from "@/shared/ui";
import {
  SupplierDetailContent,
  SupplierDetailSkeleton,
} from "@/widgets/supplier-detail";

export function SupplierDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const data = useSupplierData();

  // Show error state if needed
  if (data.error || (!data.isLoading && !data.supplier)) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.supplier")}
          description={t("notFound.supplierDescription")}
          actionLabel={t("buttons.backToSuppliers")}
          onAction={() => navigate(ROUTES.SUPPLIERS)}
        />
      </div>
    );
  }

  // Show skeleton while loading
  if (data.isLoading) {
    return <SupplierDetailSkeleton />;
  }

  return (
    <SupplierDetailPageContent
      supplier={data.supplier!}
      supplierId={data.supplierId}
      title={data.title}
      description={data.description}
    />
  );
}

function SupplierDetailPageContent({
  supplier,
  supplierId,
  title,
  description,
}: {
  supplier: SupplierDetail;
  supplierId: string | undefined;
  title: string;
  description: string;
}) {
  const notesTab = useSupplierNotesTab(supplierId);
  const mergeUnsaved = useMemo(
    () => ({
      isDirty: notesTab.isDirty,
      onDiscardMerged: notesTab.resetToSaved,
    }),
    [notesTab.isDirty, notesTab.resetToSaved]
  );
  const overview = useSupplierOverviewTab(supplier, supplierId, {
    mergeUnsaved,
  });

  return (
    <SupplierDetailContent
      supplier={supplier}
      supplierId={supplierId}
      title={title}
      description={description}
      supplierStatusActive={supplier.isActive}
      onToggleSupplierStatus={overview.requestToggleSupplierStatus}
      supplierStatusToggleLoading={overview.supplierStatusToggleLoading}
      overviewForm={overview.form as AnyFormApi}
      overviewController={overview.controller}
      notesTab={notesTab}
    />
  );
}
