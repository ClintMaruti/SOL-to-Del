import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

interface ContractedRateModalHeaderFieldsProps {
  contractId: string;
  contractLabel: string;
  seasonName: string;
  seasonNameError?: string | null;
  priority: string;
  priorityError?: string | null;
  onSeasonNameChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export function ContractedRateModalHeaderFields({
  contractId,
  contractLabel,
  seasonName,
  seasonNameError = null,
  priority,
  priorityError = null,
  onSeasonNameChange,
  onPriorityChange,
}: ContractedRateModalHeaderFieldsProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px]">
      <div className="flex min-w-0 flex-col gap-1">
        <label className="text-sm font-semibold text-foreground">
          {t("labels.contract")}
          <span className="text-[#f54a00]">*</span>
        </label>
        <Select value={contractId} disabled>
          <SelectTrigger className="h-9 w-full rounded-[6px] bg-background-primary">
            <SelectValue>{contractLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={contractId}>{contractLabel}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label className="text-sm font-semibold text-foreground">
          {t("serviceRates.seasonName")}
          <span className="text-[#f54a00]">*</span>
        </label>
        <Input
          value={seasonName}
          onChange={(e) => onSeasonNameChange(e.target.value)}
          className={`h-9 rounded-[6px] bg-background-primary${seasonNameError ? " border-brand-red focus-visible:ring-brand-red/30" : ""}`}
        />
        {seasonNameError ? (
          <p className="text-sm text-destructive">{seasonNameError}</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label className="text-sm font-semibold text-foreground">
          {t("labels.priority")}
          <span className="text-[#f54a00]">*</span>
        </label>
        <Input
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className={`h-9 rounded-[6px] bg-background-primary${priorityError ? " border-brand-red focus-visible:ring-brand-red/30" : ""}`}
        />
        {priorityError ? (
          <p className="text-sm text-destructive">{priorityError}</p>
        ) : null}
      </div>
    </div>
  );
}
