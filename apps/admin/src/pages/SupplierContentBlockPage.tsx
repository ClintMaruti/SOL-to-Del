import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useSupplier } from "@/entities/suppliers";
import { SupplierContentBlockEditForm } from "@/features/edit-supplier-content-block/ui/SupplierContentBlockEditForm";
import { ROUTES, supplierDetailPath } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";

export function SupplierContentBlockPage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const { supplierId, contentBlockId } = useParams<{
    supplierId: string;
    contentBlockId: string;
  }>();

  const { data: supplier } = useSupplier(supplierId);

  const goBackToSupplierContent = () => {
    if (supplierId) {
      navigate(`${supplierDetailPath(supplierId)}?tab=content`);
      return;
    }
    navigate(ROUTES.SUPPLIERS);
  };

  if (!supplierId || !contentBlockId) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.contentBlock")}
          description={t("notFound.contentBlockDescription")}
          actionLabel={t("buttons.backToSuppliers")}
          onAction={() => navigate(ROUTES.SUPPLIERS)}
        />
      </div>
    );
  }

  const displayName = supplier?.name?.trim() || t("pages.suppliers");

  return (
    <div className="box-border flex h-[calc(100dvh-var(--layout-reserved-footer-height,0px)-4rem)] min-h-0 flex-col overflow-hidden p-6 pt-2">
      <SupplierContentBlockEditForm
        supplierId={supplierId}
        supplierName={displayName}
        contentBlockId={contentBlockId}
        onExit={goBackToSupplierContent}
      />
    </div>
  );
}
