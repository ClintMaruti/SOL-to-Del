import { Button } from "@sol/ui";
import { useTranslation } from "react-i18next";

/**
 * Cancel/Save for the service Notes tab only. Keeps mutation-based save off shared FormPageActionButtons.
 */
export function SupplierServiceNotesActions({
  submitButtonLabel,
  onCancel,
  onSave,
  isPending,
  disableSave,
}: {
  submitButtonLabel: string;
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
  disableSave: boolean;
}) {
  const { t } = useTranslation("common");
  const disableAll = isPending;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={disableAll}
      >
        {t("buttons.cancel")}
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={onSave}
        disabled={disableAll || disableSave}
        isLoading={isPending}
        aria-label={isPending ? submitButtonLabel : undefined}
      >
        {submitButtonLabel}
      </Button>
    </>
  );
}
