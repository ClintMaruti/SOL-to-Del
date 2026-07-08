import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type {
  ServiceOptionRateApiItem,
  ServiceOptionRateUpdateRequestBody,
} from "../model/api-types";
import { normalizeWeekdaysFromApi } from "../model/catalogRateEnums";
import { mapServiceOptionRateApiItemToRate } from "../model/mapServiceOptionRatesDtoToModel";
import type { Rate, ServiceOptionRate } from "../model/types";

export type { ServiceOptionRateUpdateRequestBody } from "../model/api-types";
export type UpdateRatePayload = ServiceOptionRateUpdateRequestBody;

function buildContractedRatesForCache(
  updatedRate: Rate,
  payload: ServiceOptionRateUpdateRequestBody,
  previousRate?: ServiceOptionRate
) {
  return payload.contractedRates.map((contractedRate, contractedRateIndex) => {
    const previousContractedRate =
      previousRate?.contractedRates.find(
        (rate) => rate.id === contractedRate.id
      ) ?? previousRate?.contractedRates[contractedRateIndex];
    const responseContractedRate =
      updatedRate.contractedRates.find(
        (rate) => rate.id === contractedRate.id
      ) ?? updatedRate.contractedRates[contractedRateIndex];
    const rackCurrency =
      responseContractedRate?.rack.currency ??
      previousContractedRate?.rack.currency ??
      updatedRate.currency;
    const sellCurrency =
      responseContractedRate?.sell?.currency ??
      previousContractedRate?.sell?.currency ??
      rackCurrency;
    const contractedRateVersion =
      responseContractedRate?.version ?? previousContractedRate?.version;
    const contractedRateIsActive =
      responseContractedRate?.isActive ?? previousContractedRate?.isActive;

    return {
      id:
        contractedRate.id ??
        responseContractedRate?.id ??
        previousContractedRate?.id ??
        "",
      contractId: contractedRate.contractId,
      rateId:
        responseContractedRate?.rateId ??
        previousContractedRate?.rateId ??
        updatedRate.id,
      rack: {
        currency: rackCurrency,
        value: contractedRate.rack,
      },
      net: {
        currency:
          responseContractedRate?.net.currency ??
          previousContractedRate?.net.currency ??
          rackCurrency,
        value: contractedRate.net,
      },
      sell:
        contractedRate.sell == null
          ? null
          : {
              currency: sellCurrency,
              value: contractedRate.sell,
            },
      priority: contractedRate.priority,
      bookingWindowFrom: contractedRate.bookingWindowFrom ?? "",
      bookingWindowTo: contractedRate.bookingWindowTo ?? "",
      ...(contractedRateVersion !== undefined
        ? { version: contractedRateVersion }
        : {}),
      ...(contractedRateIsActive !== undefined
        ? { isActive: contractedRateIsActive }
        : {}),
      contractedRateDates: contractedRate.contractedRateDates.map(
        (travelDate, travelDateIndex) => {
          const previousDate =
            previousContractedRate?.contractedRateDates[travelDateIndex];
          const responseDate =
            responseContractedRate?.contractedRateDates[travelDateIndex];
          const travelDateId =
            travelDate.id ??
            responseDate?.travelDates[0]?.id ??
            previousDate?.travelDates[0]?.id;
          const contractedRateDateVersion =
            responseDate?.version ?? previousDate?.version;

          return {
            ...(contractedRateDateVersion !== undefined
              ? { version: contractedRateDateVersion }
              : {}),
            travelDates: [
              {
                ...(travelDateId !== undefined ? { id: travelDateId } : {}),
                travelDateFrom: travelDate.travelDateFrom,
                travelDateTo: travelDate.travelDateTo,
                weekdays: normalizeWeekdaysFromApi(
                  travelDate.weekdays ??
                    responseDate?.weekdays ??
                    previousDate?.travelDates[0]?.weekdays
                ),
              },
            ],
          };
        }
      ),
    };
  });
}

function mergeUpdatedRateIntoCache(
  updatedRate: Rate,
  payload: ServiceOptionRateUpdateRequestBody,
  previousRate?: ServiceOptionRate
): ServiceOptionRate {
  return {
    ...updatedRate,
    contractedRates: buildContractedRatesForCache(
      updatedRate,
      payload,
      previousRate
    ),
  };
}

export function useUpdateServiceOptionRate(
  serviceOptionId: string,
  rateId: string
) {
  const queryClient = useQueryClient();

  return useMutation<Rate, Error, ServiceOptionRateUpdateRequestBody>({
    mutationFn: async (payload: ServiceOptionRateUpdateRequestBody) => {
      const previousRate = queryClient
        .getQueryData<
          ServiceOptionRate[]
        >(["service-option-rates", serviceOptionId])
        ?.find((rate) => rate.id === rateId);
      const dto = await api.put<ServiceOptionRateApiItem>(
        `/catalog/services/options/rates/${rateId}`,
        payload
      );
      return mergeUpdatedRateIntoCache(
        mapServiceOptionRateApiItemToRate(dto),
        payload,
        previousRate
      );
    },
    onSuccess: (updatedRate) => {
      // Keep list cache in sync with PUT response so RatesSection / RateCard do not
      // briefly show stale props before refetch (same idea as useUpdateSupplier).
      queryClient.setQueryData<ServiceOptionRate[]>(
        ["service-option-rates", serviceOptionId],
        (prev) => {
          if (!prev?.length) {
            return [updatedRate];
          }
          const idx = prev.findIndex((r) => r.id === rateId);
          if (idx === -1) {
            return prev;
          }
          const next = [...prev];
          next[idx] = updatedRate;
          return next;
        }
      );
      // Do not invalidate/refetch here: a background GET can briefly return stale
      // data and overwrite this merge, causing fields (e.g. timeUnit) to flicker
      // old → new. The PUT response is authoritative for the updated row.
      toast.success(i18n.t("modals.rateUpdatedSuccess", { ns: "admin" }));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateRate", { ns: "admin" })
        )
      );
    },
  });
}
