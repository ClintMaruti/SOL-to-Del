import { useForm, useStore } from "@tanstack/react-form";
import { useCallback } from "react";

import type {
  AgeRestriction,
  EligibilityValidityDate,
  PaxCompositionGroup,
  PaxTypeConstraint,
  ServiceEligibility,
} from "@/entities/service-eligibility";
import {
  PAX_TYPE_SHORT_NAME,
  SHORT_NAME_TO_PAX_TYPE,
  type PaxType,
} from "@/entities/supplier-pax-type-schedule";
export interface EligibilityFormValues {
  isActive: boolean;
  validFrom: string;
  validTo: string;
  minimumAge: number | null;
  totalPaxMin: number | null;
  totalPaxMax: number | null;
  unitsMin: number | null;
  unitsMax: number | null;
  nightsMin: number | null;
  nightsMax: number | null;
  validityDates: EligibilityValidityDate[];
  paxCompositionGroups: PaxCompositionGroup[];
}

function createDefaultPaxTypeConstraint(): PaxTypeConstraint {
  return {
    id: nextId("ptc"),
    paxType: SHORT_NAME_TO_PAX_TYPE.ADT,
    paxCode: "ADT",
    minCount: null,
    maxCount: null,
    version: 0,
  };
}

function eligibilityToFormValues(e: ServiceEligibility): EligibilityFormValues {
  return {
    isActive: e.isActive,
    validFrom: e.validFrom,
    validTo: e.validTo,
    minimumAge: e.minAge,
    totalPaxMin: e.totalPaxMin,
    totalPaxMax: e.totalPaxMax,
    unitsMin: e.unitsMin,
    unitsMax: e.unitsMax,
    nightsMin: e.nightsMin,
    nightsMax: e.nightsMax,
    validityDates: e.validityDates,
    paxCompositionGroups: e.paxCompositionGroups,
  };
}

let localId = 0;
function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${++localId}`;
}

export function useEligibilityForm(eligibility: ServiceEligibility) {
  const form = useForm({
    defaultValues: eligibilityToFormValues(eligibility),
  });

  const isDirty = useStore(form.store, (s) => s.isDirty);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);
  const isActive = useStore(form.store, (s) => s.values.isActive);
  const validFrom = useStore(form.store, (s) => s.values.validFrom);
  const validTo = useStore(form.store, (s) => s.values.validTo);
  const minimumAge = useStore(form.store, (s) => s.values.minimumAge);
  const totalPaxMin = useStore(form.store, (s) => s.values.totalPaxMin);
  const totalPaxMax = useStore(form.store, (s) => s.values.totalPaxMax);
  const unitsMin = useStore(form.store, (s) => s.values.unitsMin);
  const unitsMax = useStore(form.store, (s) => s.values.unitsMax);
  const nightsMin = useStore(form.store, (s) => s.values.nightsMin);
  const nightsMax = useStore(form.store, (s) => s.values.nightsMax);
  const paxCompositionGroups = useStore(
    form.store,
    (s) => s.values.paxCompositionGroups
  );
  const validityDates = useStore(form.store, (s) => s.values.validityDates);

  const resetForm = useCallback(
    (e?: ServiceEligibility) => {
      form.reset(eligibilityToFormValues(e ?? eligibility));
    },
    [form, eligibility]
  );

  const toggleActive = useCallback(
    (active: boolean) => {
      form.setFieldValue("isActive", active);
    },
    [form]
  );

  const addPaxCompositionGroup = useCallback(() => {
    const current = form.getFieldValue(
      "paxCompositionGroups"
    ) as PaxCompositionGroup[];
    form.setFieldValue("paxCompositionGroups", [
      ...current,
      {
        id: nextId("pcg"),
        paxTypeConstraints: [createDefaultPaxTypeConstraint()],
        version: 0,
      },
    ]);
  }, [form]);

  const removePaxCompositionGroup = useCallback(
    (groupId: string) => {
      const current = form.getFieldValue(
        "paxCompositionGroups"
      ) as PaxCompositionGroup[];
      form.setFieldValue(
        "paxCompositionGroups",
        current.filter((g) => g.id !== groupId)
      );
    },
    [form]
  );

  const addPaxTypeConstraint = useCallback(
    (groupId: string) => {
      const current = form.getFieldValue(
        "paxCompositionGroups"
      ) as PaxCompositionGroup[];
      form.setFieldValue(
        "paxCompositionGroups",
        current.map((g) =>
          g.id === groupId
            ? {
                ...g,
                paxTypeConstraints: [
                  ...g.paxTypeConstraints,
                  createDefaultPaxTypeConstraint(),
                ],
              }
            : g
        )
      );
    },
    [form]
  );

  const updatePaxTypeConstraint = useCallback(
    (
      groupId: string,
      constraintId: string,
      updates: Partial<
        Pick<PaxTypeConstraint, "paxType" | "paxCode" | "minCount" | "maxCount">
      >
    ) => {
      const current = form.getFieldValue(
        "paxCompositionGroups"
      ) as PaxCompositionGroup[];

      const nextPaxCode = updates.paxCode;
      const nextPaxType =
        (nextPaxCode && SHORT_NAME_TO_PAX_TYPE[nextPaxCode]) ||
        (updates.paxType && PAX_TYPE_SHORT_NAME[updates.paxType as PaxType]
          ? updates.paxType
          : undefined);

      form.setFieldValue(
        "paxCompositionGroups",
        current.map((g) =>
          g.id === groupId
            ? {
                ...g,
                paxTypeConstraints: g.paxTypeConstraints.map((c) =>
                  c.id === constraintId
                    ? {
                        ...c,
                        ...updates,
                        ...(nextPaxCode ? { paxCode: nextPaxCode } : {}),
                        ...(nextPaxType ? { paxType: nextPaxType } : {}),
                        ...(updates.paxType && !nextPaxCode
                          ? {
                              paxCode:
                                PAX_TYPE_SHORT_NAME[
                                  updates.paxType as PaxType
                                ] ?? c.paxCode,
                            }
                          : {}),
                      }
                    : c
                ),
              }
            : g
        )
      );
    },
    [form]
  );

  const addAgeRestriction = useCallback(
    (groupId: string, constraintId: string) => {
      const current = form.getFieldValue(
        "paxCompositionGroups"
      ) as PaxCompositionGroup[];
      const group = current.find((g) => g.id === groupId);
      if (!group) return;

      const constraint = group.paxTypeConstraints.find(
        (c) => c.id === constraintId
      );
      if (!constraint || constraint.ageRestriction) return;

      form.setFieldValue(
        "paxCompositionGroups",
        current.map((g) =>
          g.id === groupId
            ? {
                ...g,
                paxTypeConstraints: g.paxTypeConstraints.map((c) =>
                  c.id === constraintId
                    ? {
                        ...c,
                        ageRestriction: {
                          ageMin: null,
                          ageMax: null,
                          ruleMode: "any",
                          version: 0,
                        },
                      }
                    : c
                ),
              }
            : g
        )
      );
    },
    [form]
  );

  const removeAgeRestriction = useCallback(
    (groupId: string, constraintId: string) => {
      const current = form.getFieldValue(
        "paxCompositionGroups"
      ) as PaxCompositionGroup[];
      form.setFieldValue(
        "paxCompositionGroups",
        current.map((g) =>
          g.id === groupId
            ? {
                ...g,
                paxTypeConstraints: g.paxTypeConstraints.map((c) =>
                  c.id === constraintId
                    ? { ...c, ageRestriction: undefined }
                    : c
                ),
              }
            : g
        )
      );
    },
    [form]
  );

  const updateAgeRestriction = useCallback(
    (
      groupId: string,
      constraintId: string,
      updates: Partial<Pick<AgeRestriction, "ageMin" | "ageMax" | "ruleMode">>
    ) => {
      const current = form.getFieldValue(
        "paxCompositionGroups"
      ) as PaxCompositionGroup[];
      form.setFieldValue(
        "paxCompositionGroups",
        current.map((g) =>
          g.id === groupId
            ? {
                ...g,
                paxTypeConstraints: g.paxTypeConstraints.map((c) =>
                  c.id === constraintId && c.ageRestriction
                    ? {
                        ...c,
                        ageRestriction: { ...c.ageRestriction, ...updates },
                      }
                    : c
                ),
              }
            : g
        )
      );
    },
    [form]
  );

  const addValidityDate = useCallback(() => {
    const current = form.getFieldValue(
      "validityDates"
    ) as EligibilityValidityDate[];
    form.setFieldValue("validityDates", [
      ...current,
      { id: nextId("vd"), from: "", to: "", version: 0 },
    ]);
  }, [form]);

  const removeValidityDate = useCallback(
    (dateId: string) => {
      const current = form.getFieldValue(
        "validityDates"
      ) as EligibilityValidityDate[];
      form.setFieldValue(
        "validityDates",
        current.filter((d) => d.id !== dateId)
      );
    },
    [form]
  );

  const updateValidityDate = useCallback(
    (
      dateId: string,
      updates: Partial<Pick<EligibilityValidityDate, "from" | "to">>
    ) => {
      const current = form.getFieldValue(
        "validityDates"
      ) as EligibilityValidityDate[];
      form.setFieldValue(
        "validityDates",
        current.map((d) => (d.id === dateId ? { ...d, ...updates } : d))
      );
    },
    [form]
  );

  return {
    form,
    isDirty,
    canSubmit,
    isActive,
    validFrom,
    validTo,
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
    toggleActive,
    addPaxCompositionGroup,
    removePaxCompositionGroup,
    addPaxTypeConstraint,
    updatePaxTypeConstraint,
    addAgeRestriction,
    removeAgeRestriction,
    updateAgeRestriction,
    addValidityDate,
    removeValidityDate,
    updateValidityDate,
  };
}
