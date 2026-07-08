import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";

import {
  useCreateServiceOptionRate,
  useUpdateServiceOptionRate,
  weekdaysToApiArray,
  type ChargeTypeApi,
  type CreateRatePayload,
  type ServiceOptionRate,
  type ServiceOptionRateUpdateRequestBody,
  type TimeUnitApi,
} from "@/entities/service-option-rate";
import {
  clearFormScopedOnSubmitFieldErrors,
  formDataEqual,
} from "@/shared/lib/form";

import { getContractedRateRowKey } from "./contractedRateRowKey";
import {
  DEFAULT_CONTRACTED_RATE_PRIORITY,
  type RateContractValidity,
  type RateFormSubmitData,
  validateRateFormSaveToFields,
} from "./schema";

export type RateFormContractedRate =
  RateFormSubmitData["contractedRates"][number];

const RATE_FORM_HEADER_KEYS = [
  "name",
  "chargeType",
  "timeUnit",
  "version",
] as const satisfies readonly (keyof RateFormSubmitData)[];
const RATE_FORM_SERVER_SYNC_HEADER_KEYS = [
  "name",
  "chargeType",
  "timeUnit",
] as const satisfies readonly (keyof RateFormSubmitData)[];

type TravelDateLike =
  RateFormContractedRate["contractedRateDates"][number]["travelDates"][number];

function flattenTravelDates(
  contractedRate: RateFormContractedRate
): TravelDateLike[] {
  return contractedRate.contractedRateDates.flatMap((date) => date.travelDates);
}

function contractedRatesEqualForReset(
  currentRates: RateFormSubmitData["contractedRates"],
  nextRates: RateFormSubmitData["contractedRates"]
): boolean {
  if (currentRates.length !== nextRates.length) return false;

  return currentRates.every((currentRate, rateIndex) => {
    const nextRate = nextRates[rateIndex];
    if (!nextRate) return false;

    const currentFlatDates = flattenTravelDates(currentRate);
    const nextFlatDates = flattenTravelDates(nextRate);

    return (
      formDataEqual(currentRate, nextRate, [
        "id",
        "contractId",
        "rateId",
        "rack",
        "net",
        "sell",
        "priority",
        "bookingWindowFrom",
        "bookingWindowTo",
      ]) &&
      currentFlatDates.length === nextFlatDates.length &&
      currentFlatDates.every((currentDate, dateIndex) =>
        formDataEqual(currentDate, nextFlatDates[dateIndex], [
          "id",
          "travelDateFrom",
          "travelDateTo",
          "weekdays",
        ])
      )
    );
  });
}

function contractedRatesEqualForServerSync(
  currentRates: RateFormSubmitData["contractedRates"],
  nextRates: RateFormSubmitData["contractedRates"]
): boolean {
  if (currentRates.length !== nextRates.length) return false;

  return currentRates.every((currentRate, rateIndex) => {
    const nextRate = nextRates[rateIndex];
    if (!nextRate) return false;

    const currentFlatDates = flattenTravelDates(currentRate);
    const nextFlatDates = flattenTravelDates(nextRate);

    return (
      formDataEqual(currentRate, nextRate, [
        "rack",
        "net",
        "sell",
        "priority",
        "bookingWindowFrom",
        "bookingWindowTo",
      ]) &&
      currentFlatDates.length === nextFlatDates.length &&
      currentFlatDates.every((currentDate, dateIndex) =>
        formDataEqual(currentDate, nextFlatDates[dateIndex], [
          "travelDateFrom",
          "travelDateTo",
          "weekdays",
        ])
      )
    );
  });
}

export function rateFormValuesEqualForReset(
  currentValue: RateFormSubmitData,
  nextValue: RateFormSubmitData
): boolean {
  return (
    formDataEqual(currentValue, nextValue, RATE_FORM_HEADER_KEYS) &&
    contractedRatesEqualForReset(
      currentValue.contractedRates,
      nextValue.contractedRates
    )
  );
}

function rateFormValuesEqualForServerSync(
  currentValue: RateFormSubmitData,
  nextValue: RateFormSubmitData
): boolean {
  return (
    formDataEqual(currentValue, nextValue, RATE_FORM_SERVER_SYNC_HEADER_KEYS) &&
    contractedRatesEqualForServerSync(
      currentValue.contractedRates,
      nextValue.contractedRates
    )
  );
}

export function buildResetValueAfterUpdate(
  submittedValue: RateFormSubmitData,
  updatedRate: ServiceOptionRate
): RateFormSubmitData {
  return {
    ...submittedValue,
    version: updatedRate.version ?? submittedValue.version,
    contractedRates: submittedValue.contractedRates.map(
      (contractedRate, rateIndex) => {
        const updatedContractedRate =
          updatedRate.contractedRates.find(
            (rate) => rate.id && rate.id === contractedRate.id
          ) ?? updatedRate.contractedRates[rateIndex];
        const updatedFlatTravelDates =
          updatedContractedRate?.contractedRateDates.flatMap(
            (date) => date.travelDates
          ) ?? [];
        let updatedTravelDateIndex = 0;

        return {
          ...contractedRate,
          id: updatedContractedRate?.id ?? contractedRate.id,
          contractId:
            updatedContractedRate?.contractId ?? contractedRate.contractId,
          rateId: updatedContractedRate?.rateId ?? contractedRate.rateId,
          contractedRateDates: contractedRate.contractedRateDates.map(
            (date) => ({
              ...date,
              travelDates: date.travelDates.map((travelDate) => {
                const updatedTravelDate =
                  updatedFlatTravelDates[updatedTravelDateIndex++];

                return {
                  ...travelDate,
                  id: updatedTravelDate?.id ?? travelDate.id,
                  weekdays: updatedTravelDate?.weekdays ?? travelDate.weekdays,
                };
              }),
            })
          ),
        };
      }
    ),
  };
}

function assertPositiveMoneyForApi(
  value: number | null,
  field: "net" | "rack"
): number {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Invalid ${field} for API: expected a positive number after validation`
    );
  }
  return value;
}

export interface RateEntryFormValues {
  name: string;
  chargeType: ChargeTypeApi;
  timeUnit: TimeUnitApi;
  contractedRates: RateFormSubmitData["contractedRates"];
}

export const INITIAL_RATE_ENTRY: RateEntryFormValues = {
  name: "",
  chargeType: "Person",
  timeUnit: "Night",
  contractedRates: [],
};

export const EMPTY_CONTRACTED_RATE: RateFormContractedRate = {
  id: "",
  contractId: "",
  rateId: "",
  rack: { currency: "USD", value: null },
  net: { currency: "USD", value: null },
  sell: { currency: "USD", value: null },
  priority: DEFAULT_CONTRACTED_RATE_PRIORITY,
  bookingWindowFrom: "",
  bookingWindowTo: "",
  contractedRateDates: [
    {
      travelDates: [
        {
          travelDateFrom: "",
          travelDateTo: "",
          weekdays: "",
        },
      ],
    },
  ],
};

/** New draft row with a stable {@link RateFormContractedRate.clientRowKey} for per-row validation UX. */
export function createEmptyContractedRate(): RateFormContractedRate {
  return {
    ...EMPTY_CONTRACTED_RATE,
    clientRowKey: crypto.randomUUID(),
  };
}

/** Default form values for a brand-new rate card (contracted rates added via "Add Contract Rate"). */
export function createNewRateDraftInitialData(): RateFormSubmitData {
  return {
    ...INITIAL_RATE_ENTRY,
    contractedRates: [],
  };
}

export function buildCreateRatePayload(
  data: RateFormSubmitData,
  contractId: string | null
): CreateRatePayload {
  return {
    name: data.name,
    chargeType: data.chargeType,
    timeUnit: data.timeUnit,
    contractedRates: data.contractedRates.map((cr) => ({
      ...(cr.id ? { id: cr.id } : {}),
      contractId: contractId as string,
      rack: assertPositiveMoneyForApi(cr.rack.value, "rack"),
      net: assertPositiveMoneyForApi(cr.net.value, "net"),
      sell:
        cr.sell?.value != null && Number.isFinite(cr.sell.value)
          ? cr.sell.value
          : null,
      priority: cr.priority ?? DEFAULT_CONTRACTED_RATE_PRIORITY,
      bookingWindowFrom: cr.bookingWindowFrom || null,
      bookingWindowTo: cr.bookingWindowTo || null,
      contractedRateDates: cr.contractedRateDates.flatMap((crd) =>
        crd.travelDates.map((td) => ({
          ...(td.id ? { id: td.id } : {}),
          travelDateFrom: td.travelDateFrom,
          travelDateTo: td.travelDateTo,
          weekdays: weekdaysToApiArray(td.weekdays),
        }))
      ),
    })),
  };
}

export function buildUpdateRatePayload(
  data: RateFormSubmitData,
  contractId: string | null
): ServiceOptionRateUpdateRequestBody {
  return {
    ...buildCreateRatePayload(data, contractId),
    version: data.version ?? 0,
  };
}

export function useRateForm(
  initialData?: RateFormSubmitData | null,
  serviceOptionId?: string | null,
  rateId?: string | null,
  contractId?: string | null,
  contractValidity?: RateContractValidity | null,
  /** Called after a new rate is persisted; receives the created rate (for parent UI, e.g. keep card expanded). */
  onDraftRateCreated?: (created: ServiceOptionRate) => void,
  isDuplicateDraft?: boolean,
  /** Called when a save attempt finishes (success or error), after validation passed and mutations settle. */
  onSubmitFinished?: () => void
) {
  const formDefaultValuesRef = useRef<RateFormSubmitData | null>(null);
  if (formDefaultValuesRef.current == null) {
    formDefaultValuesRef.current =
      initialData ?? createNewRateDraftInitialData();
  }
  const prevInitialDataRef = useRef<RateFormSubmitData | null | undefined>(
    initialData
  );
  const contractValidityRef = useRef<RateContractValidity | null | undefined>(
    contractValidity
  );
  contractValidityRef.current = contractValidity;
  const suppressDuplicateDirtyRef = useRef(false);

  /** Rows that existed when client-side save validation last failed; used for inline table errors only. */
  const [
    contractedRateRowKeysWithSubmitErrors,
    setContractedRateRowKeysWithSubmitErrors,
  ] = useState<Set<string> | null>(null);

  const createRate = useCreateServiceOptionRate(serviceOptionId as string);
  const updateRate = useUpdateServiceOptionRate(
    serviceOptionId as string,
    rateId as string
  );

  const form = useForm({
    /**
     * TanStack Form re-applies changed `defaultValues` whenever the form is still
     * untouched. Travel-date add/remove uses array helpers, which can leave the
     * form dirty without marking it touched; passing live `initialData` here lets
     * parent cache updates briefly overwrite the local save result and causes the
     * row bounce the user sees on add/delete.
     *
     * Keep defaults stable after mount and sync real server changes via the
     * effect below with `form.reset(..., { keepDefaultValues: true })`.
     */
    defaultValues: formDefaultValuesRef.current,
    canSubmitWhenInvalid: true,
    validators: {
      onSubmit: ({ value }) => {
        const data = value as RateFormSubmitData;
        const fields = validateRateFormSaveToFields(
          data,
          contractValidityRef.current
        );
        if (Object.keys(fields).length > 0) {
          setContractedRateRowKeysWithSubmitErrors(
            new Set(
              data.contractedRates.map((cr, i) =>
                getContractedRateRowKey(cr, i)
              )
            )
          );
          return { fields };
        }
        setContractedRateRowKeysWithSubmitErrors(null);
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        const data = value as RateFormSubmitData;
        let created: ServiceOptionRate | undefined;
        let nextFormValue = data;
        if (rateId) {
          const updatedRate = await updateRate.mutateAsync(
            buildUpdateRatePayload(data, contractId as string)
          );
          nextFormValue = buildResetValueAfterUpdate(data, updatedRate);
        } else {
          created = await createRate.mutateAsync(
            buildCreateRatePayload(data, contractId as string)
          );
          suppressDuplicateDirtyRef.current = true;
        }
        form.reset(nextFormValue, { keepDefaultValues: true });
        if (!rateId && created) {
          onDraftRateCreated?.(created);
        }
        setContractedRateRowKeysWithSubmitErrors(null);
      } finally {
        onSubmitFinished?.();
      }
    },
  });

  useEffect(() => {
    if (!initialData) return;
    const previousInitialData = prevInitialDataRef.current;
    const currentValue = form.state.values as RateFormSubmitData;
    const initialDataChanged =
      previousInitialData == null ||
      !rateFormValuesEqualForReset(previousInitialData, initialData);

    if (!initialDataChanged) return;

    prevInitialDataRef.current = initialData;

    // When save succeeds, parent cache can rerender with fresh ids/version before
    // mutateAsync returns and we can apply buildResetValueAfterUpdate(). Ignore
    // those server-only metadata changes here so the just-saved local rows do not
    // bounce split/grouped for a frame.
    if (rateFormValuesEqualForServerSync(currentValue, initialData)) {
      setContractedRateRowKeysWithSubmitErrors(null);
      return;
    }

    form.reset(initialData, { keepDefaultValues: true });
    setContractedRateRowKeysWithSubmitErrors(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const formIsDirty = useStore(form.store, (state) => state.isDirty);
  const isDirty =
    formIsDirty ||
    Boolean(isDuplicateDraft && !rateId && !suppressDuplicateDirtyRef.current);

  const reset = (next?: RateFormSubmitData | null) => {
    setContractedRateRowKeysWithSubmitErrors(null);
    form.reset(
      next ?? initialData ?? formDefaultValuesRef.current ?? INITIAL_RATE_ENTRY,
      { keepDefaultValues: true }
    );
  };

  const handleSave = () => {
    clearFormScopedOnSubmitFieldErrors(form);
    form.handleSubmit();
  };

  return {
    form,
    isDirty,
    reset,
    handleSave,
    contractedRateRowKeysWithSubmitErrors,
    isSubmitting: createRate.isPending || updateRate.isPending,
    isSuccess: createRate.isSuccess || updateRate.isSuccess,
  };
}
