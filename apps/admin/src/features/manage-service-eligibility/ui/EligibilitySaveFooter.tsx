import { Button } from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { EligibilityValidityDate } from "@/entities/service-eligibility";

import { useEligibilitySaveFooter } from "../model/useEligibilitySaveFooter";

interface EligibilitySaveFooterProps {
  eligibilityId: string;
  serviceId: string;
  validityDates: EligibilityValidityDate[];
  fieldErrors: string[];
  submitErrors: string[];
  saveAttempted: boolean;
  onSaveAttempted: (v: boolean) => void;
  isDirty: boolean;
  canSubmit: boolean;
  isSaving?: boolean;
  onSave: () => void;
}

export function EligibilitySaveFooter({
  eligibilityId,
  serviceId,
  validityDates,
  fieldErrors,
  submitErrors,
  saveAttempted,
  onSaveAttempted,
  isDirty,
  canSubmit,
  isSaving,
  onSave,
}: EligibilitySaveFooterProps) {
  const { t } = useTranslation("admin");
  const {
    handleSave,
    hasDateError,
    hasFieldErrors,
    inlineError,
    visibleFieldErrors,
  } = useEligibilitySaveFooter({
    eligibilityId,
    serviceId,
    validityDates,
    fieldErrors,
    submitErrors,
    saveAttempted,
    onSaveAttempted,
    onSave,
  });

  return (
    <div className="flex flex-col">
      {isDirty && (visibleFieldErrors.length > 0 || inlineError) && (
        <div className="flex flex-col gap-1 border-x border-border bg-background px-4 pt-3">
          {visibleFieldErrors.map((err, index) => (
            <div
              key={`${err}-${index}`}
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
          {inlineError && (
            <div className="flex items-center gap-2 text-sm font-bold text-destructive">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-[60px] items-end justify-end rounded-b-[6px] border-border bg-background px-4 py-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={!isDirty || hasDateError || hasFieldErrors || !canSubmit}
          isLoading={isSaving}
        >
          {t("buttons.saveEligibility")}
        </Button>
      </div>
    </div>
  );
}
