import { useTranslation } from "react-i18next";

import { ListEmpty } from "@/shared/ui";

interface SupplierListEmptyProps {
  onCreateSupplier?: () => void;
}

export function SupplierListEmpty({
  onCreateSupplier,
}: SupplierListEmptyProps) {
  const { t } = useTranslation("admin");
  return (
    <ListEmpty
      title={t("empty.noSuppliers")}
      description={
        <>
          {t("empty.noSuppliersDescription")}
          <br /> {t("empty.noSuppliersCreate")}
        </>
      }
      onAction={onCreateSupplier}
    />
  );
}
