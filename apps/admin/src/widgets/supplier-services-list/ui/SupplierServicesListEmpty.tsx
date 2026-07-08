import { FileX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListEmpty } from "@/shared/ui";

interface SupplierServicesListEmptyProps {
  onCreateService?: () => void;
}

export function SupplierServicesListEmpty({
  onCreateService,
}: SupplierServicesListEmptyProps) {
  const { t } = useTranslation("admin");
  const icon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <FileX className="h-6 w-6 text-sky-600" />
    </div>
  );

  return (
    <ListEmpty
      title={t("empty.noServices")}
      description={
        <>
          {t("empty.noServicesDescription")}
          <br /> {t("empty.noServicesCreate")}
        </>
      }
      icon={icon}
      hideButtonIcon={true}
      actionLabel={t("buttons.createService")}
      onAction={onCreateService}
    />
  );
}
