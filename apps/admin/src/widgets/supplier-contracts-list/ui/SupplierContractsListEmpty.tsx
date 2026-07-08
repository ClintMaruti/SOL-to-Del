import { FileX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListEmpty } from "@/shared/ui";

interface SupplierContractsListEmptyProps {
  onAttachContract?: () => void;
}

export function SupplierContractsListEmpty({
  onAttachContract,
}: SupplierContractsListEmptyProps) {
  const { t } = useTranslation("admin");
  const icon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <FileX className="h-6 w-6 text-sky-600" />
    </div>
  );

  return (
    <ListEmpty
      title={t("empty.noContracts")}
      description={
        <>
          {t("empty.noContractsDescription")}
          <br /> {t("empty.noContractsCreate")}
        </>
      }
      hideButtonIcon={true}
      icon={icon}
      actionLabel={t("buttons.attachContract")}
      onAction={onAttachContract}
    />
  );
}
