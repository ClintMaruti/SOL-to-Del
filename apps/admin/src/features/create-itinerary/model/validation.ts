import type { CreateItineraryPayload } from "@/entities/itinerary";

const AGENCY_SELECTION_PREFIX = "agency:";
const AGENT_SELECTION_PREFIX = "agent:";
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NON_NEGATIVE_INTEGER_REGEX = /^\d+$/;
const LEAD_TRAVELER_NAME_DISALLOWED_REGEX = /[^\p{L}\p{M}\s'-]/gu;
const MAX_TEXT_LENGTH = 255;

export interface CreateItineraryFormValues {
  crmReferenceNumber: string;
  agencySelection: string;
  travelDateFrom: string;
  travelDateTo: string;
  destinations: string[];
  leadTravelerName: string;
  adultsCount: string;
  childrenCount: string;
  infantsCount: string;
}

export type CreateItineraryFieldName = keyof CreateItineraryFormValues;

export type CreateItineraryFieldErrors = Partial<
  Record<CreateItineraryFieldName, string>
>;

type CreateItineraryCountFieldName =
  | "adultsCount"
  | "childrenCount"
  | "infantsCount";

export interface CreateItineraryValidationContext {
  activeAgencyIds: ReadonlySet<string>;
  activeAgentAgencyById: ReadonlyMap<string, string>;
  activeDestinationIds: ReadonlySet<string>;
}

export interface CreateItineraryValidationMessages {
  required: (field: string) => string;
  maxLength: (field: string, max: number) => string;
  invalidDate: (field: string) => string;
  dateToBeforeFrom: string;
  inactiveAgency: string;
  inactiveAgent: string;
  agentAgencyMismatch: string;
  destinationsRequired: string;
  inactiveDestination: string;
  integer: (field: string) => string;
  atLeastOne: (field: string) => string;
  zeroOrGreater: (field: string) => string;
}

export interface CreateItineraryFieldLabels {
  crmReferenceNumber: string;
  agency: string;
  travelDateFrom: string;
  travelDateTo: string;
  destination: string;
  leadTravelerName: string;
  adultsCount: string;
  childrenCount: string;
  infantsCount: string;
}

export const INITIAL_CREATE_ITINERARY_FORM_VALUES: CreateItineraryFormValues = {
  crmReferenceNumber: "",
  agencySelection: "",
  travelDateFrom: "",
  travelDateTo: "",
  destinations: [],
  leadTravelerName: "",
  adultsCount: "",
  childrenCount: "",
  infantsCount: "",
};

export type AgencySelection =
  | { type: "agency"; id: string }
  | { type: "agent"; id: string };

export type CreateItineraryValidationResult =
  | { success: true; payload: CreateItineraryPayload }
  | { success: false; fieldErrors: CreateItineraryFieldErrors };

export function agencySelectionValue(selection: AgencySelection) {
  return `${selection.type === "agency" ? AGENCY_SELECTION_PREFIX : AGENT_SELECTION_PREFIX}${selection.id}`;
}

export function parseAgencySelection(value: string): AgencySelection | null {
  if (value.startsWith(AGENCY_SELECTION_PREFIX)) {
    const id = value.slice(AGENCY_SELECTION_PREFIX.length);
    return id ? { type: "agency", id } : null;
  }

  if (value.startsWith(AGENT_SELECTION_PREFIX)) {
    const id = value.slice(AGENT_SELECTION_PREFIX.length);
    return id ? { type: "agent", id } : null;
  }

  return null;
}

export function isValidIsoDate(value: string) {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function sanitizeLeadTravelerNameInput(value: string) {
  return value.replace(LEAD_TRAVELER_NAME_DISALLOWED_REGEX, "");
}

function setFirstError(
  errors: CreateItineraryFieldErrors,
  field: CreateItineraryFieldName,
  message: string
) {
  if (!errors[field]) {
    errors[field] = message;
  }
}

function parseRequiredPositiveInteger(
  value: string,
  field: CreateItineraryCountFieldName,
  labels: CreateItineraryFieldLabels,
  messages: CreateItineraryValidationMessages,
  errors: CreateItineraryFieldErrors
) {
  const raw = value.trim();
  const label = labels[field];

  if (!raw) {
    setFirstError(errors, field, messages.required(label));
    return 0;
  }

  if (!NON_NEGATIVE_INTEGER_REGEX.test(raw)) {
    setFirstError(errors, field, messages.integer(label));
    return 0;
  }

  const parsed = Number(raw);
  if (parsed < 1) {
    setFirstError(errors, field, messages.atLeastOne(label));
    return 0;
  }

  return parsed;
}

function parseOptionalNonNegativeInteger(
  value: string,
  field: CreateItineraryCountFieldName,
  labels: CreateItineraryFieldLabels,
  messages: CreateItineraryValidationMessages,
  errors: CreateItineraryFieldErrors
) {
  const raw = value.trim();
  const label = labels[field];

  if (!raw) {
    return 0;
  }

  if (!NON_NEGATIVE_INTEGER_REGEX.test(raw)) {
    setFirstError(errors, field, messages.integer(label));
    return 0;
  }

  const parsed = Number(raw);
  if (parsed < 0) {
    setFirstError(errors, field, messages.zeroOrGreater(label));
    return 0;
  }

  return parsed;
}

export function validateCreateItineraryForm(
  values: CreateItineraryFormValues,
  context: CreateItineraryValidationContext,
  labels: CreateItineraryFieldLabels,
  messages: CreateItineraryValidationMessages
): CreateItineraryValidationResult {
  const errors: CreateItineraryFieldErrors = {};
  const crmReferenceNumber = values.crmReferenceNumber.trim();
  const leadTravelerName = sanitizeLeadTravelerNameInput(
    values.leadTravelerName
  ).trim();

  if (!crmReferenceNumber) {
    setFirstError(
      errors,
      "crmReferenceNumber",
      messages.required(labels.crmReferenceNumber)
    );
  } else if (crmReferenceNumber.length > MAX_TEXT_LENGTH) {
    setFirstError(
      errors,
      "crmReferenceNumber",
      messages.maxLength(labels.crmReferenceNumber, MAX_TEXT_LENGTH)
    );
  }

  if (leadTravelerName.length > MAX_TEXT_LENGTH) {
    setFirstError(
      errors,
      "leadTravelerName",
      messages.maxLength(labels.leadTravelerName, MAX_TEXT_LENGTH)
    );
  }

  const selection = parseAgencySelection(values.agencySelection);
  let agencyId = "";
  let agentId: string | null = null;

  if (!selection) {
    setFirstError(errors, "agencySelection", messages.required(labels.agency));
  } else if (selection.type === "agency") {
    agencyId = selection.id;
    if (!context.activeAgencyIds.has(agencyId)) {
      setFirstError(errors, "agencySelection", messages.inactiveAgency);
    }
  } else {
    agentId = selection.id;
    const agentAgencyId = context.activeAgentAgencyById.get(selection.id);
    if (!agentAgencyId) {
      setFirstError(errors, "agencySelection", messages.inactiveAgent);
    } else {
      agencyId = agentAgencyId;
      if (!context.activeAgencyIds.has(agencyId)) {
        setFirstError(errors, "agencySelection", messages.agentAgencyMismatch);
      }
    }
  }

  if (!values.travelDateFrom) {
    setFirstError(
      errors,
      "travelDateFrom",
      messages.required(labels.travelDateFrom)
    );
  } else if (!isValidIsoDate(values.travelDateFrom)) {
    setFirstError(
      errors,
      "travelDateFrom",
      messages.invalidDate(labels.travelDateFrom)
    );
  }

  if (!values.travelDateTo) {
    setFirstError(
      errors,
      "travelDateTo",
      messages.required(labels.travelDateTo)
    );
  } else if (!isValidIsoDate(values.travelDateTo)) {
    setFirstError(
      errors,
      "travelDateTo",
      messages.invalidDate(labels.travelDateTo)
    );
  } else if (
    isValidIsoDate(values.travelDateFrom) &&
    values.travelDateTo < values.travelDateFrom
  ) {
    setFirstError(errors, "travelDateTo", messages.dateToBeforeFrom);
  }

  if (values.destinations.length === 0) {
    setFirstError(errors, "destinations", messages.destinationsRequired);
  } else if (
    values.destinations.some((id) => !context.activeDestinationIds.has(id))
  ) {
    setFirstError(errors, "destinations", messages.inactiveDestination);
  }

  const adultsCount = parseRequiredPositiveInteger(
    values.adultsCount,
    "adultsCount",
    labels,
    messages,
    errors
  );
  const childrenCount = parseOptionalNonNegativeInteger(
    values.childrenCount,
    "childrenCount",
    labels,
    messages,
    errors
  );
  const infantsCount = parseOptionalNonNegativeInteger(
    values.infantsCount,
    "infantsCount",
    labels,
    messages,
    errors
  );

  if (Object.values(errors).some(Boolean)) {
    return { success: false, fieldErrors: errors };
  }

  const nameParts = leadTravelerName ? leadTravelerName.split(/\s+/) : [];
  const leadTravelerFirstName = nameParts[0];
  const leadTravelerLastName =
    nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  return {
    success: true,
    payload: {
      mode: "new",
      travelDateFrom: values.travelDateFrom,
      travelDateTo: values.travelDateTo,
      agencyId,
      agentId,
      ...(leadTravelerFirstName ? { leadTravelerFirstName } : {}),
      ...(leadTravelerLastName ? { leadTravelerLastName } : {}),
      adultsCount,
      childrenCount,
      infantsCount,
      childrenAges: [],
    },
  };
}
