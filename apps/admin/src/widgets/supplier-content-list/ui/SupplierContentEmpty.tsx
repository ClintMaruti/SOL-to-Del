import { useTranslation } from "react-i18next";

export function SupplierContentEmpty() {
  const { t } = useTranslation("admin");

  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border bg-muted/10 px-4 py-12 text-center"
      role="status"
    >
      <p className="text-sm font-medium text-text-secondary">
        {t("supplierContent.empty")}
      </p>
    </div>
  );
}
