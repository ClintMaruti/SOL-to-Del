import type { OptionFormValues } from "./useOptionForm";

export type OptionFormFieldErrors = Partial<
  Record<keyof OptionFormValues, string>
>;

const API_FIELD_TO_FORM_FIELD: Record<string, keyof OptionFormValues> = {
  title: "title",
  optiontitle: "title",
  serviceoptiontitle: "title",
  serviceoptiontitleminlength: "title",
  serviceoptiontitlemaxlength: "title",
  serviceoptiontitleunique: "title",
  serviceoptiontitlealreadyexists: "title",
  includes: "includes",
  excludes: "excludes",
  timefrom: "timeFrom",
  servicoptiontimefrom: "timeFrom",
  serviceoptiontimefrom: "timeFrom",
  timeto: "timeTo",
  serviceoptiontimeto: "timeTo",
  flightnumber: "flightNumber",
  flightno: "flightNumber",
  flightoptionflightnumber: "flightNumber",
  operatingdays: "operatingDaySelected",
  serviceoptionoperatingdays: "operatingDaySelected",
  flightoptionoperatingdays: "operatingDaySelected",
  activityoptionoperatingdays: "operatingDaySelected",
  transportoptionoperatingdays: "operatingDaySelected",
};

function normalizeApiFieldName(field: string) {
  return field.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function toOptionFormErrors(
  errors: Record<string, string[]>
): OptionFormFieldErrors {
  const fieldErrors: OptionFormFieldErrors = {};

  for (const [apiField, messages] of Object.entries(errors)) {
    const message = messages[0];
    if (!message) {
      continue;
    }

    const fieldName = API_FIELD_TO_FORM_FIELD[normalizeApiFieldName(apiField)];
    if (fieldName && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = message;
    }
  }

  return fieldErrors;
}

export function hasOptionFormErrors(errors: OptionFormFieldErrors) {
  return Object.values(errors).some(Boolean);
}
