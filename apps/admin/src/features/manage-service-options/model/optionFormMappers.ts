import type { ServiceOption } from "@/entities/supplier-service-options";

import {
  createDefaultOperatingDaySelection,
  createEmptyOperatingDaySelection,
  isScheduleServiceType,
  operatingDaysToSelection,
} from "./operating-days";
import { backendScheduleTimeToForm } from "./scheduleApiTime";
import type { OptionFormValues } from "./useOptionForm";

export function serviceOptionToFormValues(
  option: ServiceOption,
  serviceType?: string
): OptionFormValues {
  const schedule =
    option.flightOption ?? option.activityOption ?? option.transportOption;
  const operatingDaySelected = schedule
    ? operatingDaysToSelection(schedule.operatingDays)
    : isScheduleServiceType(serviceType)
      ? createEmptyOperatingDaySelection()
      : createDefaultOperatingDaySelection();

  return {
    title: option.title,
    includes: option.includes ?? "",
    excludes: option.excludes ?? "",
    contractId: option.contractId,
    isActive: option.isActive,
    timeFrom: backendScheduleTimeToForm(schedule?.timeFrom),
    timeTo: backendScheduleTimeToForm(schedule?.timeTo),
    flightNumber: option.flightOption?.flightNumber ?? "",
    operatingDaySelected,
  };
}
