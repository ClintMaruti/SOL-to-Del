import type {
  CreateItineraryFieldErrors,
  CreateItineraryFieldName,
} from "./validation";

const API_FIELD_TO_FORM_FIELD: Record<string, CreateItineraryFieldName> = {
  crmreferencenumber: "crmReferenceNumber",
  agencyid: "agencySelection",
  agentid: "agencySelection",
  traveldatefrom: "travelDateFrom",
  traveldateto: "travelDateTo",
  destination: "destinations",
  destinations: "destinations",
  leadtravelername: "leadTravelerName",
  adultscount: "adultsCount",
  childrencount: "childrenCount",
  infantscount: "infantsCount",
};

function normalizeApiFieldName(field: string) {
  return field.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function toCreateItineraryFormErrors(
  errors: Record<string, string[]>
): CreateItineraryFieldErrors {
  const fieldErrors: CreateItineraryFieldErrors = {};

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
