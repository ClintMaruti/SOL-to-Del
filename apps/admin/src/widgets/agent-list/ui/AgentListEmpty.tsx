import { FileX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListEmpty } from "@/shared/ui";

interface AgentListEmptyProps {
  onCreateAgent?: () => void;
}

export function AgentListEmpty({ onCreateAgent }: AgentListEmptyProps) {
  const { t } = useTranslation("admin");
  const icon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <FileX className="h-6 w-6 text-sky-600" />
    </div>
  );

  return (
    <ListEmpty
      title={t("empty.noAgents")}
      description={t("empty.noAgentsFullDescription")}
      icon={icon}
      onAction={onCreateAgent}
    />
  );
}
