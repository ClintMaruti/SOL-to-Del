import type {
  CreateServiceOptionPayload,
  UpdateServiceOptionPayload,
} from "@/entities/supplier-service-options";

import { operatingDaysFromSelection } from "./operating-days";
import { toApi12HourTime } from "./scheduleApiTime";
import type { OptionFormValues } from "./useOptionForm";

/** Flight requires `timeFrom` / `timeTo` strings on the API shape. */
function scheduleFieldsFromForm(values: OptionFormValues) {
  return {
    operatingDays: operatingDaysFromSelection(values.operatingDaySelected),
    timeFrom: toApi12HourTime(values.timeFrom.trim()),
    timeTo: toApi12HourTime(values.timeTo.trim()),
  };
}

/** Activity / transportation allow omitting empty times on the payload. */
function scheduleFieldsFromFormOptionalTimes(values: OptionFormValues) {
  const from = toApi12HourTime(values.timeFrom.trim());
  const to = toApi12HourTime(values.timeTo.trim());
  const operatingDays = operatingDaysFromSelection(values.operatingDaySelected);

  return {
    ...(operatingDays.length > 0 ? { operatingDays } : {}),
    ...(from ? { timeFrom: from } : {}),
    ...(to ? { timeTo: to } : {}),
  };
}

/** Build nested mutation fields for create (no `version`). Omits reference-only nested objects on create. */
export function buildCreateServiceOptionBody(
  serviceType: string | undefined,
  values: OptionFormValues
): Omit<CreateServiceOptionPayload, "serviceId"> {
  const base: Omit<CreateServiceOptionPayload, "serviceId"> = {
    title: values.title,
    includes: values.includes?.trim() || undefined,
    excludes: values.excludes?.trim() || undefined,
    contractId: values.contractId,
    isActive: values.isActive,
  };

  if (!serviceType) return base;

  if (serviceType === "flight") {
    return {
      ...base,
      flightOption: {
        ...scheduleFieldsFromForm(values),
        flightNumber: values.flightNumber.trim(),
      },
    };
  }
  if (serviceType === "activity") {
    return {
      ...base,
      activityOption: scheduleFieldsFromFormOptionalTimes(values),
    };
  }
  if (serviceType === "transportation") {
    return {
      ...base,
      transportOption: scheduleFieldsFromFormOptionalTimes(values),
    };
  }

  return base;
}

/** Build full update payload including `version` and the nested object for this service type. */
export function buildUpdateServiceOptionPayload(
  serviceType: string | undefined,
  values: OptionFormValues,
  optionId: string,
  version: number
): UpdateServiceOptionPayload {
  const base: UpdateServiceOptionPayload = {
    title: values.title,
    includes: values.includes?.trim() || undefined,
    excludes: values.excludes?.trim() || undefined,
    contractId: values.contractId,
    isActive: values.isActive,
    version,
  };

  if (!serviceType) return base;

  if (serviceType === "flight") {
    return {
      ...base,
      flightOption: {
        ...scheduleFieldsFromForm(values),
        flightNumber: values.flightNumber.trim(),
      },
    };
  }
  if (serviceType === "activity") {
    return {
      ...base,
      activityOption: scheduleFieldsFromFormOptionalTimes(values),
    };
  }
  if (serviceType === "transportation") {
    return {
      ...base,
      transportOption: scheduleFieldsFromFormOptionalTimes(values),
    };
  }
  if (serviceType === "accommodation") {
    return {
      ...base,
      accommodationOption: { serviceOptionId: optionId },
    };
  }
  if (serviceType === "other") {
    return {
      ...base,
      otherOption: { serviceOptionId: optionId },
    };
  }
  if (serviceType === "fee") {
    return {
      ...base,
      feeOption: { serviceOptionId: optionId },
    };
  }

  return base;
}
