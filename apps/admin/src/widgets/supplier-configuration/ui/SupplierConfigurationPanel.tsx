import { useTranslation } from "react-i18next";

import { SupplierCloseoutsCard } from "@/widgets/supplier-closeouts";
import { SupplierPaxConfigurationsSection } from "@/widgets/supplier-pax-configurations";

interface SupplierConfigurationPanelProps {
  supplierId: string;
}

export function SupplierConfigurationPanel({
  supplierId,
}: SupplierConfigurationPanelProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="flex flex-col gap-4 pt-4">
      <h2 className="text-base font-bold text-neutral-900 leading-6">
        {t("tabs.configuration")}
      </h2>
      <SupplierPaxConfigurationsSection supplierId={supplierId} />
      <SupplierCloseoutsCard supplierId={supplierId} />
    </div>
  );
}
