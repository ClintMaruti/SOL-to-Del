import { Button } from "@sol/ui";
import { useTranslation } from "react-i18next";

export interface AgentDetailsFooterProps {
  /** Called when Cancel is clicked */
  onCancel: () => void;
  /** Whether save is in progress (disables buttons) */
  isPending?: boolean;
  /** Form element id for the submit button (Save submits the form) */
  formId?: string;
}

/** Height of the fixed footer (for content padding-bottom). */
export const AGENT_DETAILS_FOOTER_HEIGHT = 72;

export function AgentDetailsFooter({
  onCancel,
  isPending = false,
  formId,
}: AgentDetailsFooterProps) {
  const { t } = useTranslation("common");
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-white"
      aria-label={t("aria.formActions")}
    >
      <div className="flex items-center justify-end gap-2 px-6 py-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("buttons.cancel")}
        </Button>
        <Button
          type={formId ? "submit" : "button"}
          variant="primary"
          form={formId}
          isLoading={isPending}
          className="rounded-md"
          aria-label={isPending ? t("buttons.save") : undefined}
        >
          {t("buttons.save")}
        </Button>
      </div>
    </footer>
  );
}
