import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";

import { useValueBasedDirty } from "@/shared/hooks";
import { formDataEqual } from "@/shared/lib/form";

import type { CreateAgencyFormData } from "./types";

export const INITIAL_FORM_DATA: CreateAgencyFormData = {
  agencyName: "",
  iataCode: "",
  agencyGroupIds: [],
  sourceMarket: "",
  assignedSafariPlannerId: "",
  assignedSafariPlannerName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  postalCode: "",
  streetAddress: "",
  website: "",
  depositPercent: "20",
  balanceDueDays: "60",
  taxCode: "",
  hasCreditTerms: false,
  creditTermsNote: "",
  needsWhiteLabel: false,
  whiteLabelNote: "",
  agentZoneVisible: false,
  agentZoneId: "",
  agencyAffiliations: "",
  kenXeroId: "",
  rwXeroId: "",
  tzXeroId: "",
  znzXeroId: "",
  additionalNotes: "",
};

const FORM_KEYS = Object.keys(
  INITIAL_FORM_DATA
) as (keyof CreateAgencyFormData)[];

/** Options for edit mode: ignore stale query snapshots that regress `version`. */
export interface UseCreateAgencyFormOptions {
  /** Server concurrency version from the loaded entity (e.g. agency.version). */
  dataRevision?: number;
  /** When this changes (e.g. agency id), revision tracking resets. */
  entityKey?: string;
}

export function useCreateAgencyForm(
  initialData?: CreateAgencyFormData | null,
  options?: UseCreateAgencyFormOptions
) {
  const { dataRevision, entityKey } = options ?? {};
  const prevInitialDataRef = useRef<CreateAgencyFormData | null | undefined>(
    initialData
  );
  const lastSyncedRevisionRef = useRef<number | undefined>(undefined);
  const prevEntityKeyRef = useRef<string | undefined>(undefined);

  const form = useForm({
    defaultValues: initialData ?? INITIAL_FORM_DATA,
  });

  const formValues = useStore(
    form.store,
    (state) => state.values
  ) as CreateAgencyFormData;

  const {
    isDirty,
    reset: resetDirty,
    setBaseline,
    setHasSeenFormMatchingInitial,
  } = useValueBasedDirty<CreateAgencyFormData>(
    formValues,
    initialData ?? null,
    FORM_KEYS,
    INITIAL_FORM_DATA
  );

  useEffect(() => {
    if (entityKey === undefined) {
      prevEntityKeyRef.current = undefined;
      return;
    }
    if (prevEntityKeyRef.current !== entityKey) {
      prevEntityKeyRef.current = entityKey;
      lastSyncedRevisionRef.current = undefined;
      prevInitialDataRef.current = undefined;
    }
  }, [entityKey]);

  // Sync when initialData *value* changes (for edit mode). Value-based check avoids
  // infinite loops when the parent passes a new object reference every render (e.g. in tests).
  useEffect(() => {
    if (!initialData) return;

    if (
      typeof dataRevision === "number" &&
      typeof lastSyncedRevisionRef.current === "number" &&
      dataRevision < lastSyncedRevisionRef.current
    ) {
      return;
    }

    const prev = prevInitialDataRef.current;
    const dataChanged =
      prev == null || !formDataEqual(prev, initialData, FORM_KEYS);
    if (dataChanged) {
      prevInitialDataRef.current = initialData;
      form.reset(initialData);
      if (typeof dataRevision === "number") {
        lastSyncedRevisionRef.current = dataRevision;
      }
      queueMicrotask(() => {
        setHasSeenFormMatchingInitial(false);
        setBaseline({ ...initialData });
      });
    }
  }, [
    initialData,
    dataRevision,
    form,
    setBaseline,
    setHasSeenFormMatchingInitial,
  ]);

  const reset = (
    nextInitial?: CreateAgencyFormData | null,
    resetOpts?: { dataRevision?: number }
  ) => {
    const next = nextInitial ?? initialData ?? INITIAL_FORM_DATA;
    resetDirty(next);
    form.reset(next);
    prevInitialDataRef.current = next;
    const rev = resetOpts?.dataRevision;
    if (typeof rev === "number") {
      lastSyncedRevisionRef.current = rev;
    }
  };
  return {
    form,
    isDirty,
    reset,
  };
}
