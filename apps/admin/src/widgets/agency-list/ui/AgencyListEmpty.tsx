import { FileX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListEmpty } from "@/shared/ui";

interface AgencyListEmptyProps {
  onCreateAgency?: () => void;
}

export function AgencyListEmpty({ onCreateAgency }: AgencyListEmptyProps) {
  const { t } = useTranslation("admin");
  const icon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <FileX className="h-6 w-6 text-sky-600" />
    </div>
  );

  return (
    <ListEmpty
      title={t("empty.noAgencies")}
      description={t("empty.noAgenciesFullDescription")}
      icon={icon}
      onAction={onCreateAgency}
    />
  );
}
