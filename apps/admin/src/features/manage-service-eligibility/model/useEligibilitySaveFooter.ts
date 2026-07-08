import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { EligibilityValidityDate } from "@/entities/service-eligibility";

import {
  selectEligibilityHasOverlap,
  useValidityDatesStore,
} from "./validity-dates-store";

interface UseEligibilitySaveFooterParams {
  eligibilityId: string;
  serviceId: string;
  validityDates: EligibilityValidityDate[];
  fieldErrors: string[];
  submitErrors: string[];
  saveAttempted: boolean;
  onSaveAttempted: (value: boolean) => void;
  onSave: () => void;
}

export function useEligibilitySaveFooter({
  eligibilityId,
  serviceId,
  validityDates,
  fieldErrors,
  submitErrors,
  saveAttempted,
  onSaveAttempted,
  onSave,
}: UseEligibilitySaveFooterParams) {
  const { t } = useTranslation("admin");
  const hasDateOverlap = useValidityDatesStore(
    selectEligibilityHasOverlap(eligibilityId, serviceId)
  );

  const hasInvertedRange = validityDates.some(
    (vd) => vd.from && vd.to && vd.from > vd.to
  );
  const hasDateError = hasDateOverlap || hasInvertedRange;
  const hasFieldErrors = fieldErrors.length > 0;
  const hasSubmitErrors = submitErrors.length > 0;

  const inlineError = hasInvertedRange
    ? t("errors.startDateAfterEndDate")
    : hasDateError
      ? t("errors.validityDatesOverlap")
      : null;

  const visibleFieldErrors = saveAttempted
    ? [...fieldErrors, ...submitErrors]
    : fieldErrors;

  const handleSave = useCallback(() => {
    if (hasSubmitErrors) {
      onSaveAttempted(true);
      return;
    }

    onSave();
  }, [hasSubmitErrors, onSaveAttempted, onSave]);

  return {
    handleSave,
    hasDateError,
    hasFieldErrors,
    inlineError,
    visibleFieldErrors,
  };
}
