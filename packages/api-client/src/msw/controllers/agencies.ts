import { HttpResponse } from "msw";

/** Mirrors catalog NoteDto in JSON (camelCase). */
type MockCatalogNote = {
  id: string;
  text: string;
  version: number;
};

type MockAgencyGroupSummary = {
  id: string;
  name: string;
};

const AGENCY_GROUPS: MockAgencyGroupSummary[] = [
  { id: "ag-1", name: "AAConsultants" },
  { id: "ag-2", name: "AngamaSpecial" },
  { id: "ag-3", name: "RAgent" },
  { id: "ag-4", name: "WHAgent" },
  { id: "ag-5", name: "ZooGroup" },
  { id: "ag-6", name: "StandaloneGroup" },
];

function toAgencyGroups(ids: string[]): MockAgencyGroupSummary[] {
  return ids
    .map((id) => AGENCY_GROUPS.find((group) => group.id === id))
    .filter((group): group is MockAgencyGroupSummary => Boolean(group))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
}

function toAgencyReadDto(agency: MockAgency) {
  const { agencyGroupIds, ...rest } = agency;
  return {
    ...rest,
    agencyGroups: toAgencyGroups(agencyGroupIds),
  };
}

function validationErrorResponse(errors: Record<string, string[]>) {
  return HttpResponse.json(
    { title: "Validation failed", errors },
    { status: 400 }
  );
}

function validateAgencyGroupIds(agencyGroupIds: unknown): string[] | Response {
  if (!Array.isArray(agencyGroupIds) || agencyGroupIds.length === 0) {
    return validationErrorResponse({
      agencyGroupIds: ["At least one agency group is required."],
    });
  }

  const ids = agencyGroupIds.filter(
    (id): id is string => typeof id === "string"
  );
  if (ids.length !== agencyGroupIds.length || ids.some((id) => !id.trim())) {
    return validationErrorResponse({
      agencyGroupIds: ["Agency group IDs must be non-empty strings."],
    });
  }

  if (new Set(ids).size !== ids.length) {
    return validationErrorResponse({
      agencyGroupIds: ["Agency group IDs must be distinct."],
    });
  }

  const knownIds = new Set(AGENCY_GROUPS.map((group) => group.id));
  if (ids.some((id) => !knownIds.has(id))) {
    return validationErrorResponse({
      agencyGroupIds: ["All agency groups must exist."],
    });
  }

  return ids;
}

/** Agency shape matching backend API (GET/POST /catalog/agencies) */
export type MockAgency = {
  id: string;
  name: string;
  sourceMarketId: string;
  iataAgencyCode: string | null;
  email: string;
  number: string;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  website: string | null;
  kenXeroId: string | null;
  rwXeroId: string | null;
  tzXeroId: string | null;
  znzXeroId: string | null;
  paymentDepositPercent: number;
  paymentBalanceDueDays: number;
  paymentTaxCode: string;
  hasCreditTerms: boolean;
  creditNotes: string | null;
  requiresWhiteLabeling: boolean;
  whiteLabelingNote: string | null;
  visibilityForAgentZone: boolean;
  agentZoneId: string | null;
  agencyAffiliations: string | null;
  additionalNotes: MockCatalogNote | null;
  isActive: boolean;
  version: number;
  agentsCount?: number;
  agencyGroupIds: string[];
  agencyGroups: MockAgencyGroupSummary[];
  assignedSafariPlannerId?: string;
  assignedSafariPlannerName?: string;
  sourceMarketName?: string;
  agents?: unknown[];
};

const defaultAgencyFields: Omit<
  MockAgency,
  | "id"
  | "name"
  | "email"
  | "number"
  | "sourceMarketId"
  | "agencyGroupIds"
  | "agencyGroups"
  | "assignedSafariPlannerId"
  | "assignedSafariPlannerName"
  | "agentsCount"
  | "isActive"
> = {
  iataAgencyCode: null,
  country: null,
  city: null,
  postalCode: null,
  address: null,
  website: null,
  kenXeroId: null,
  rwXeroId: null,
  tzXeroId: null,
  znzXeroId: null,
  paymentDepositPercent: 100,
  paymentBalanceDueDays: 0,
  paymentTaxCode: "",
  hasCreditTerms: false,
  creditNotes: null,
  requiresWhiteLabeling: false,
  whiteLabelingNote: null,
  visibilityForAgentZone: false,
  agentZoneId: null,
  agencyAffiliations: null,
  additionalNotes: null,
  version: 0,
};

let mockAgencies: MockAgency[] = [
  {
    id: "agency-1",
    name: "Kilimanjaro Experts",
    email: "info@kilimanjaroexperts.com",
    number: "+255 123 456 789",
    sourceMarketId: "FIT",
    agencyGroupIds: ["ag-1", "ag-4"],
    agencyGroups: toAgencyGroups(["ag-1", "ag-4"]),
    assignedSafariPlannerId: "sp-1",
    assignedSafariPlannerName: "Erik Karlsson",
    agentsCount: 0,
    isActive: false,
    ...defaultAgencyFields,
  },
  {
    id: "agency-2",
    name: "Serengeti Adventures",
    email: "contact@serengetiadventures.com",
    number: "+255 234 567 890",
    sourceMarketId: "FIT",
    agencyGroupIds: ["ag-2"],
    agencyGroups: toAgencyGroups(["ag-2"]),
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
    agentsCount: 7,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-3",
    name: "Africa Tours",
    email: "hello@africatours.com",
    number: "+27 11 234 5678",
    sourceMarketId: "AF",
    agencyGroupIds: ["ag-3"],
    agencyGroups: toAgencyGroups(["ag-3"]),
    assignedSafariPlannerId: "sp-3",
    assignedSafariPlannerName: "Amelia Earhart",
    agentsCount: 2,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-4",
    name: "Okavango Explorers",
    email: "bookings@okavangoexplorers.com",
    number: "+267 123 4567",
    sourceMarketId: "AS",
    agencyGroupIds: ["ag-4"],
    agencyGroups: toAgencyGroups(["ag-4"]),
    assignedSafariPlannerId: "sp-4",
    assignedSafariPlannerName: "Sofia Rodriguez",
    agentsCount: 6,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-5",
    name: "Zambezi Rovers",
    email: "info@zambezirovers.com",
    number: "+260 97 123 4567",
    sourceMarketId: "ANZ",
    agencyGroupIds: ["ag-3"],
    agencyGroups: toAgencyGroups(["ag-3"]),
    assignedSafariPlannerId: "sp-5",
    assignedSafariPlannerName: "Linnea Johansson",
    agentsCount: 5,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-6",
    name: "Masai Mara Safaris",
    email: "reservations@masaimarasafaris.com",
    number: "+254 20 123 4567",
    sourceMarketId: "UK",
    agencyGroupIds: ["ag-2"],
    agencyGroups: toAgencyGroups(["ag-2"]),
    assignedSafariPlannerId: "sp-6",
    assignedSafariPlannerName: "Mikael Blomkvist",
    agentsCount: 3,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-7",
    name: "Kruger Getaways",
    email: "travel@krugergetaways.com",
    number: "+27 13 456 7890",
    sourceMarketId: "EE",
    agencyGroupIds: ["ag-4"],
    agencyGroups: toAgencyGroups(["ag-4"]),
    assignedSafariPlannerId: "sp-7",
    assignedSafariPlannerName: "Amelia Earhart",
    agentsCount: 8,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-8",
    name: "Etosha Escapes",
    email: "bookings@etoshaescapes.com",
    number: "+264 61 234 567",
    sourceMarketId: "ME",
    agencyGroupIds: ["ag-5"],
    agencyGroups: toAgencyGroups(["ag-5"]),
    assignedSafariPlannerId: "sp-8",
    assignedSafariPlannerName: "Bjorn Borg",
    agentsCount: 1,
    isActive: true,
    ...defaultAgencyFields,
  },
  {
    id: "agency-9",
    name: "Africa Treks",
    email: "adventures@africatreks.com",
    number: "+255 765 432 109",
    sourceMarketId: "NA",
    agencyGroupIds: ["ag-1"],
    agencyGroups: toAgencyGroups(["ag-1"]),
    assignedSafariPlannerId: "sp-9",
    assignedSafariPlannerName: "Ingrid Bergman",
    agentsCount: 6,
    isActive: true,
    ...defaultAgencyFields,
  },
];

function getRequestedAgencyGroupIds(request: Request) {
  const url = new URL(request.url);
  return [
    ...url.searchParams.getAll("agencyGroupIds"),
    ...url.searchParams.getAll("agencyGroupId"),
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

// GET /catalog/agencies - Fetch all agencies
export const getAgencies = ({ request }: { request: Request }) => {
  const agencyGroupIds = getRequestedAgencyGroupIds(request);
  const agencies =
    agencyGroupIds.length > 0
      ? mockAgencies.filter((agency) =>
          agency.agencyGroupIds.some((id) => agencyGroupIds.includes(id))
        )
      : mockAgencies;

  return HttpResponse.json(
    { success: true, data: agencies.map(toAgencyReadDto), error: null },
    { status: 200 }
  );
};

// Data getter for use in composed handlers (e.g. agency + agents)
export const getAgencyByIdData = (id: string): MockAgency | null =>
  mockAgencies.find((a) => a.id === id) ?? null;

// GET /catalog/agencies/:id - Fetch single agency (full detail for view/update)
export const getAgencyById = ({ params }: { params: { id: string } }) => {
  const agency = getAgencyByIdData(params.id);
  if (!agency) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(
    { success: true, data: toAgencyReadDto(agency), error: null },
    { status: 200 }
  );
};

/** Request body for PUT /catalog/agencies/:id (backend shape) */
type UpdateAgencyPayload = {
  name?: string;
  sourceMarketId?: string;
  iataAgencyCode?: string | null;
  email?: string;
  number?: string;
  country?: string | null;
  city?: string | null;
  postalCode?: string | null;
  address?: string | null;
  website?: string | null;
  kenXeroId?: string | null;
  rwXeroId?: string | null;
  tzXeroId?: string | null;
  znzXeroId?: string | null;
  paymentDepositPercent?: number;
  paymentBalanceDueDays?: number;
  paymentTaxCode?: string;
  hasCreditTerms?: boolean;
  creditNotes?: string | null;
  requiresWhiteLabeling?: boolean;
  whiteLabelingNote?: string | null;
  visibilityForAgentZone?: boolean;
  agentZoneId?: string | null;
  agencyAffiliations?: string | null;
  additionalNotes?: MockCatalogNote | null;
  agencyGroupIds?: string[];
  id?: string;
  isActive?: boolean;
  version?: number;
};

function applyAgencyUpdate(id: string, body: Partial<UpdateAgencyPayload>) {
  const agencyIndex = mockAgencies.findIndex((a) => a.id === id);
  if (agencyIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency not found" },
      { status: 404 }
    );
  }
  const current = mockAgencies[agencyIndex];
  const nextAgencyGroupIds =
    body.agencyGroupIds === undefined
      ? current.agencyGroupIds
      : validateAgencyGroupIds(body.agencyGroupIds);

  if (nextAgencyGroupIds instanceof Response) {
    return nextAgencyGroupIds;
  }

  const updated: MockAgency = {
    ...current,
    name: body.name ?? current.name,
    iataAgencyCode: body.iataAgencyCode ?? current.iataAgencyCode,
    sourceMarketId: body.sourceMarketId ?? current.sourceMarketId,
    email: body.email ?? current.email,
    number: body.number ?? current.number,
    country: body.country ?? current.country,
    city: body.city ?? current.city,
    postalCode: body.postalCode ?? current.postalCode,
    address: body.address ?? current.address,
    website: body.website ?? current.website,
    paymentDepositPercent:
      body.paymentDepositPercent ?? current.paymentDepositPercent,
    paymentBalanceDueDays:
      body.paymentBalanceDueDays ?? current.paymentBalanceDueDays,
    paymentTaxCode: body.paymentTaxCode ?? current.paymentTaxCode,
    hasCreditTerms: body.hasCreditTerms ?? current.hasCreditTerms,
    creditNotes: body.creditNotes ?? current.creditNotes,
    requiresWhiteLabeling:
      body.requiresWhiteLabeling ?? current.requiresWhiteLabeling,
    whiteLabelingNote: body.whiteLabelingNote ?? current.whiteLabelingNote,
    visibilityForAgentZone:
      body.visibilityForAgentZone ?? current.visibilityForAgentZone,
    agentZoneId: body.agentZoneId ?? current.agentZoneId,
    agencyAffiliations: body.agencyAffiliations ?? current.agencyAffiliations,
    kenXeroId: body.kenXeroId ?? current.kenXeroId,
    rwXeroId: body.rwXeroId ?? current.rwXeroId,
    tzXeroId: body.tzXeroId ?? current.tzXeroId,
    znzXeroId: body.znzXeroId ?? current.znzXeroId,
    additionalNotes:
      body.additionalNotes !== undefined
        ? body.additionalNotes
        : current.additionalNotes,
    agencyGroupIds: nextAgencyGroupIds,
    agencyGroups: toAgencyGroups(nextAgencyGroupIds),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
    version: (current.version ?? 0) + 1,
  };
  mockAgencies[agencyIndex] = updated;
  return HttpResponse.json(
    { success: true, data: toAgencyReadDto(updated), error: null },
    { status: 200 }
  );
}

// PATCH /catalog/agencies/:id - Update agency
export const updateAgency = async ({
  params,
  request,
}: {
  params: { id: string };
  request: Request;
}) => {
  const body = (await request.json()) as Partial<UpdateAgencyPayload>;
  return applyAgencyUpdate(params.id, body);
};

/** PUT /catalog/agencies — catalog client sends id in body (same payload as PATCH). */
export const putUpdateAgency = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as Partial<UpdateAgencyPayload> & {
    id?: string;
  };
  const id = body.id;
  if (!id) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency id is required" },
      { status: 400 }
    );
  }
  return applyAgencyUpdate(id, body);
};

// PATCH /catalog/agency/:id/activate - Activate agency
export const activateAgency = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agencyIndex = mockAgencies.findIndex((a) => a.id === id);
  if (agencyIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency not found" },
      { status: 404 }
    );
  }
  mockAgencies[agencyIndex].isActive = true;
  return HttpResponse.json(
    {
      success: true,
      data: toAgencyReadDto(mockAgencies[agencyIndex]),
      error: null,
    },
    { status: 200 }
  );
};

// PATCH /catalog/agency/:id/deactivate - Deactivate agency
export const deactivateAgency = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agencyIndex = mockAgencies.findIndex((a) => a.id === id);
  if (agencyIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency not found" },
      { status: 404 }
    );
  }
  mockAgencies[agencyIndex].isActive = false;
  return HttpResponse.json(
    {
      success: true,
      data: toAgencyReadDto(mockAgencies[agencyIndex]),
      error: null,
    },
    { status: 200 }
  );
};

/** Request body for POST /api/catalog/agencies (backend contract) */
type CreateAgencyRequestBody = {
  name: string;
  sourceMarketId: string;
  iataAgencyCode: string | null;
  email: string;
  number: string;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  website: string | null;
  kenXeroId: string | null;
  rwXeroId: string | null;
  tzXeroId: string | null;
  znzXeroId: string | null;
  paymentDepositPercent: number;
  paymentBalanceDueDays: number;
  paymentTaxCode: string;
  hasCreditTerms: boolean;
  creditNotes: string | null;
  requiresWhiteLabeling: boolean;
  whiteLabelingNote: string | null;
  visibilityForAgentZone: boolean;
  agentZoneId: string | null;
  agencyAffiliations: string | null;
  additionalNotes: MockCatalogNote | null;
  agencyGroupIds: string[];
};

// POST /catalog/agencies - Create a new agency
export const createAgency = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as Partial<CreateAgencyRequestBody>;

  if (!body.name?.trim()) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency name is required" },
      { status: 400 }
    );
  }

  const agencyGroupIds = validateAgencyGroupIds(body.agencyGroupIds);
  if (agencyGroupIds instanceof Response) {
    return agencyGroupIds;
  }

  const id = `agency-${Date.now()}`;
  const newAgency: MockAgency = {
    id,
    name: body.name ?? "",
    sourceMarketId: body.sourceMarketId ?? "",
    iataAgencyCode: body.iataAgencyCode ?? null,
    email: body.email ?? "",
    number: body.number ?? "",
    country: body.country ?? null,
    city: body.city ?? null,
    postalCode: body.postalCode ?? null,
    address: body.address ?? null,
    website: body.website ?? null,
    kenXeroId: body.kenXeroId ?? null,
    rwXeroId: body.rwXeroId ?? null,
    tzXeroId: body.tzXeroId ?? null,
    znzXeroId: body.znzXeroId ?? null,
    paymentDepositPercent: body.paymentDepositPercent ?? 100,
    paymentBalanceDueDays: body.paymentBalanceDueDays ?? 0,
    paymentTaxCode: body.paymentTaxCode ?? "",
    hasCreditTerms: body.hasCreditTerms ?? false,
    creditNotes: body.creditNotes ?? null,
    requiresWhiteLabeling: body.requiresWhiteLabeling ?? false,
    whiteLabelingNote: body.whiteLabelingNote ?? null,
    visibilityForAgentZone: body.visibilityForAgentZone ?? false,
    agentZoneId: body.agentZoneId ?? null,
    agencyAffiliations: body.agencyAffiliations ?? null,
    additionalNotes:
      body.additionalNotes !== undefined ? body.additionalNotes : null,
    agencyGroupIds,
    agencyGroups: toAgencyGroups(agencyGroupIds),
    isActive: true,
    version: 0,
    agentsCount: 0,
  };

  mockAgencies.push(newAgency);

  return HttpResponse.json(
    { success: true, data: toAgencyReadDto(newAgency), error: null },
    { status: 201 }
  );
};

// DELETE /catalog/agencies/:id - Delete an agency
export const deleteAgency = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agencyIndex = mockAgencies.findIndex((a) => a.id === id);

  if (agencyIndex === -1) {
    return HttpResponse.json(
      {
        success: false,
        data: null,
        error: "Agency not found",
      },
      { status: 404 }
    );
  }

  // Remove the agency from the list
  mockAgencies = mockAgencies.filter((a) => a.id !== id);

  return new HttpResponse(null, { status: 204 });
};
