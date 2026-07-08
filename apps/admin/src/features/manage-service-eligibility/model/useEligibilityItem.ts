import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ServiceEligibility } from "@/entities/service-eligibility";

import { computeFieldErrors, computeSubmitErrors } from "./computeFieldErrors";
import type {
  ServiceEligibilityItemHandlers,
  ServiceEligibilitySaveHandler,
} from "./serviceEligibilitySectionTypes";
import type { EligibilityFormValues } from "./useEligibilityForm";
import { useEligibilityForm } from "./useEligibilityForm";
import {
  selectEligibilityHasOverlap,
  useValidityDatesStore,
} from "./validity-dates-store";

interface UseEligibilityItemParams {
  eligibility: ServiceEligibility;
  defaultOpen?: boolean;
  isNew?: boolean;
  onSave: ServiceEligibilitySaveHandler;
  onDirtyChange?: (id: string, isDirty: boolean) => void;
  registerHandlers?: (
    id: string,
    handlers: ServiceEligibilityItemHandlers | null
  ) => void;
}

export function useEligibilityItem({
  eligibility,
  defaultOpen = true,
  isNew,
  onSave,
  onDirtyChange,
  registerHandlers,
}: UseEligibilityItemParams) {
  const { t } = useTranslation("admin");
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const formState = useEligibilityForm(eligibility);
  const {
    form,
    isDirty,
    canSubmit,
    minimumAge,
    totalPaxMin,
    totalPaxMax,
    unitsMin,
    unitsMax,
    nightsMin,
    nightsMax,
    paxCompositionGroups,
    validityDates,
    resetForm,
    addValidityDate: formAddValidityDate,
    removeValidityDate: formRemoveValidityDate,
    updateValidityDate: formUpdateValidityDate,
  } = formState;

  const capValues = useMemo(
    () => ({
      totalPaxMin,
      totalPaxMax,
      unitsMin,
      unitsMax,
      nightsMin,
      nightsMax,
      minimumAge,
    }),
    [
      totalPaxMin,
      totalPaxMax,
      unitsMin,
      unitsMax,
      nightsMin,
      nightsMax,
      minimumAge,
    ]
  );

  const fieldErrors = useMemo(
    () => computeFieldErrors(t, capValues, paxCompositionGroups),
    [t, capValues, paxCompositionGroups]
  );

  const submitErrors = useMemo(
    () =>
      computeSubmitErrors(t, capValues, validityDates, paxCompositionGroups),
    [t, capValues, validityDates, paxCompositionGroups]
  );

  useEffect(() => {
    onDirtyChange?.(eligibility.id, isDirty);
    return () => onDirtyChange?.(eligibility.id, false);
  }, [isDirty, eligibility.id, onDirtyChange]);

  const previousEligibilityRef = useRef(eligibility);
  useEffect(() => {
    if (previousEligibilityRef.current !== eligibility) {
      resetForm(eligibility);
      previousEligibilityRef.current = eligibility;
    }
  }, [eligibility, resetForm]);

  const hasDateOverlap = useValidityDatesStore(
    selectEligibilityHasOverlap(eligibility.id, eligibility.serviceId)
  );
  const setDate = useValidityDatesStore((s) => s.setDate);
  const removeDate = useValidityDatesStore((s) => s.removeDate);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isHistorical = useMemo(
    () =>
      validityDates.length > 0 &&
      validityDates.every((date) => Boolean(date.to) && date.to < today),
    [today, validityDates]
  );

  const hasInvertedRange = validityDates.some(
    (vd) => vd.from && vd.to && vd.from > vd.to
  );
  const hasDateError = hasDateOverlap || hasInvertedRange;
  const canSave =
    !isHistorical &&
    !hasDateError &&
    fieldErrors.length === 0 &&
    submitErrors.length === 0 &&
    canSubmit;

  const addValidityDate = useCallback(() => {
    formAddValidityDate();
    const dates = form.getFieldValue(
      "validityDates"
    ) as EligibilityFormValues["validityDates"];
    const newest = dates[dates.length - 1];

    if (!newest) return;

    setDate(newest.id, {
      from: newest.from,
      to: newest.to,
      eligibilityId: eligibility.id,
      serviceId: eligibility.serviceId,
    });
  }, [
    formAddValidityDate,
    form,
    setDate,
    eligibility.id,
    eligibility.serviceId,
  ]);

  const removeValidityDate = useCallback(
    (dateId: string) => {
      formRemoveValidityDate(dateId);
      removeDate(dateId);
    },
    [formRemoveValidityDate, removeDate]
  );

  const updateValidityDate = useCallback(
    (dateId: string, updates: { from?: string; to?: string }) => {
      formUpdateValidityDate(dateId, updates);
    },
    [formUpdateValidityDate]
  );

  const saveCurrent = useCallback(async () => {
    setSaveAttempted(true);
    if (!canSave) return undefined;

    const savedEligibility = await onSave(
      eligibility.id,
      form.state.values as EligibilityFormValues,
      eligibility.version
    );

    if (savedEligibility) {
      resetForm(savedEligibility);
    }

    return savedEligibility;
  }, [canSave, eligibility.id, eligibility.version, form, onSave, resetForm]);

  const handleSave = useCallback(() => {
    void saveCurrent().catch(() => undefined);
  }, [saveCurrent]);

  useEffect(() => {
    registerHandlers?.(eligibility.id, {
      validate: async () => {
        setSaveAttempted(true);
        return canSave;
      },
      isDirty: () => Boolean(isNew || isDirty),
      saveAsync: saveCurrent,
      cancel: () => {
        resetForm(eligibility);
        setSaveAttempted(false);
      },
    });

    return () => registerHandlers?.(eligibility.id, null);
  }, [
    canSave,
    eligibility,
    isDirty,
    isNew,
    registerHandlers,
    resetForm,
    saveCurrent,
  ]);

  return {
    ...formState,
    fieldErrors,
    handleSave,
    isHistorical,
    isOpen,
    saveAttempted,
    setIsOpen,
    setSaveAttempted,
    submitErrors,
    addValidityDate,
    removeValidityDate,
    updateValidityDate,
  };
}
