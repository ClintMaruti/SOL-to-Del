import { Button, Switch } from "@sol/ui";
import { useTranslation } from "react-i18next";

export interface AgentDetailsHeaderProps {
  /** Agent display name (e.g. firstName + lastName) */
  agentName: string;
  /** Whether the agent is active (controls the switch) */
  isActive: boolean;
  /** Called when the Active switch is toggled */
  onStatusChange: (checked: boolean) => void;
  /** Called when Cancel is clicked */
  onCancel: () => void;
  /** Called when Save is clicked (or when submit button is activated) */
  onSave: () => void;
  /** Whether save is in progress (disables buttons) */
  isPending?: boolean;
  /** Form element id for the submit button (so Save submits the form) */
  formId?: string;
}

export function AgentDetailsHeader({
  agentName,
  isActive,
  onStatusChange,
  onCancel,
  onSave,
  isPending = false,
  formId,
}: AgentDetailsHeaderProps) {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <div className="flex items-center justify-between gap-6">
      {/* Agent Name - Left Side */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {agentName}
        </h1>
      </div>

      {/* Controls - Right Side */}
      <div className="flex items-center gap-4">
        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="agent-active-toggle"
            className="text-sm font-medium text-foreground whitespace-nowrap"
          >
            {t("admin:status.active")}
          </label>
          <Switch
            id="agent-active-toggle"
            checked={isActive}
            onCheckedChange={onStatusChange}
            aria-label={t("admin:aria.toggleActiveStatus", { name: agentName })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type={formId ? "submit" : "button"}
            variant="primary"
            form={formId}
            onClick={formId ? undefined : onSave}
            isLoading={isPending}
            aria-label={isPending ? t("common:buttons.save") : undefined}
          >
            {t("common:buttons.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
