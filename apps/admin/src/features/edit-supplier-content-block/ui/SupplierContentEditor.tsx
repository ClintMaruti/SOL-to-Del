import { useTranslation } from "react-i18next";

import { SupplierContentList } from "@/widgets/supplier-content-list";

interface SupplierContentEditorProps {
  supplierId: string;
}

/**
 * Supplier Detail → Content tab: list of predefined sections with links to the standalone edit page.
 */
export function SupplierContentEditor({
  supplierId,
}: SupplierContentEditorProps) {
  const { t } = useTranslation(["admin"]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 bg-accent py-4 min-h-[calc(100dvh-var(--layout-reserved-footer-height,0px)-4rem-17rem)]">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("admin:supplierContent.sectionTitle")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm font-medium text-text-secondary">
          {t("admin:supplierContent.sectionDescription")}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <SupplierContentList supplierId={supplierId} />
      </div>
    </div>
  );
}
