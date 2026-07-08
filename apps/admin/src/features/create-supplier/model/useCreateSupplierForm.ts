import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";

import { useValueBasedDirty } from "@/shared/hooks";
import { formDataEqual } from "@/shared/lib/form";

import type { CreateSupplierFormData, PaymentTermEntry } from "./types";

export const DEFAULT_PAYMENT_TERM: PaymentTermEntry = {
  name: "General",
  travelDatesFrom: "",
  travelDatesTo: "",
  depositPercent: 20,
  balanceDueDays: 60,
};

export const INITIAL_FORM_DATA: CreateSupplierFormData = {
  name: "",
  headOfficeId: "",
  code: "",
  additionalName: "",
  starRating: 0,
  serviceTypeId: "",
  type: "",
  preferredSupplier: false,

  email: "",
  phone: "",
  additionalEmail: "",
  secondAdditionalEmail: "",
  website: "",
  liveAvailabilityCheck: "",
  otherCommunicationChannels: "",

  countryId: "",
  city: "",
  postalCode: "",
  streetAddress: "",
  poBox: "",
  locationId: "",
  latitude: "",
  longitude: "",
  closestAirstrip: "",
  airstripLatitude: 0,
  airstripLongitude: 0,

  checkIn: "",
  checkOut: "",
  pickUp: "",
  dropOff: "",

  xeroId: "",

  paymentTerms: [{ ...DEFAULT_PAYMENT_TERM }],
  taxCode: "Standard",
  visibilityForAgentZone: false,
  agentZoneId: "",
  isActive: false,
};

const FORM_KEYS = Object.keys(
  INITIAL_FORM_DATA
) as (keyof CreateSupplierFormData)[];

export function useCreateSupplierForm(
  initialData?: CreateSupplierFormData | null
) {
  const prevInitialDataRef = useRef<CreateSupplierFormData | null | undefined>(
    initialData
  );

  const form = useForm({
    defaultValues: initialData ?? INITIAL_FORM_DATA,
  });

  const formValues = useStore(
    form.store,
    (state) => state.values
  ) as CreateSupplierFormData;
  const {
    isDirty,
    reset: resetDirty,
    setBaseline,
    setHasSeenFormMatchingInitial,
  } = useValueBasedDirty<CreateSupplierFormData>(
    formValues,
    initialData ?? null,
    FORM_KEYS,
    INITIAL_FORM_DATA
  );

  // Sync when initialData *value* changes (for edit mode). Value-based check avoids
  // infinite loops when the parent passes a new object reference every render (e.g. in tests).
  useEffect(() => {
    if (!initialData) return;
    const prev = prevInitialDataRef.current;
    const dataChanged =
      prev == null || !formDataEqual(prev, initialData, FORM_KEYS);

    if (dataChanged) {
      prevInitialDataRef.current = initialData;
      form.reset(initialData);
      queueMicrotask(() => {
        setHasSeenFormMatchingInitial(false);
        setBaseline({ ...initialData });
      });
    }
  }, [initialData, form, setBaseline, setHasSeenFormMatchingInitial]);

  const reset = (nextInitial?: CreateSupplierFormData | null) => {
    const next = nextInitial ?? initialData ?? INITIAL_FORM_DATA;
    resetDirty(next);
    form.reset(next);
  };

  return {
    form,
    isDirty,
    reset,
  };
}
