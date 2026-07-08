import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListEmpty } from "@/shared/ui";

interface ItinerariesListEmptyProps {
  onCreate?: () => void;
}

export function ItinerariesListEmpty({ onCreate }: ItinerariesListEmptyProps) {
  const { t } = useTranslation(["admin", "common"]);
  const icon = (
    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100">
      <FileText className="h-6 w-6 text-sky-600" />
    </div>
  );

  return (
    <ListEmpty
      title={t("admin:itineraries.emptyTitle")}
      description={t("admin:itineraries.emptyDescription")}
      icon={icon}
      onAction={onCreate}
      actionLabel={t("common:buttons.create")}
    />
  );
}
