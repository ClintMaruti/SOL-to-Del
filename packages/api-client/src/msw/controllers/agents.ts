import { http, HttpResponse } from "msw";

import { getAgencyByIdData } from "./agencies";

/** Mirrors catalog NoteDto in JSON (camelCase). */
type MockCatalogNote = {
  id: string;
  text: string;
  version: number;
};

/** Mock agent shape aligned with Agent entity (entities/agent/model/types.ts) */
type MockAgent = {
  id: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  alternateEmail?: string;
  phone: string;
  agencyId: string;
  agencyName?: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  language?: string;
  notes?: MockCatalogNote | null;
  currency?: string;
  status: "Active" | "Inactive";
  version: number;
};

const VERSION_ZERO = { version: 0 };

function toAgentDto(agent: MockAgent) {
  const agency = getAgencyByIdData(agent.agencyId);

  return {
    id: agent.id,
    version: agent.version,
    firstName: agent.firstName,
    lastName: agent.lastName,
    primaryEmail: agent.primaryEmail,
    phoneNumber: agent.phone,
    agencyId: agent.agencyId,
    agencyName: agent.agencyName,
    agencyGroups: agency?.agencyGroups ?? [],
    assignedSafariPlannerId: agent.assignedSafariPlannerId,
    assignedSafariPlannerName: agent.assignedSafariPlannerName,
    isActive: agent.status === "Active",
    alternateEmail: agent.alternateEmail,
    language: agent.language,
    notes: agent.notes,
    currency: agent.currency,
  };
}

let mockAgents: MockAgent[] = [
  {
    id: "agent-1",
    firstName: "Gugu",
    lastName: "Mbatha-Raw",
    primaryEmail: "erik.karlsson@safari.com",
    phone: "+1 23-555-901-2345",
    agencyId: "agency-1",
    agencyName: "Kilimanjaro Experts",
    assignedSafariPlannerId: "sp-1",
    assignedSafariPlannerName: "Erik Karlsson",
    status: "Inactive",
    ...VERSION_ZERO,
  },
  {
    id: "agent-2",
    firstName: "Jomo",
    lastName: "Kenyatta",
    primaryEmail: "a.earhart@safari.com",
    phone: "+1 23-555-890-1234",
    agencyId: "agency-2",
    agencyName: "Serengeti Adventures",
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-3",
    firstName: "Jonathan",
    lastName: "Annan",
    primaryEmail: "a.earhart@adventure.com",
    phone: "+1 23-555-789-0123",
    agencyId: "agency-3",
    agencyName: "Africa Tours",
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-4",
    firstName: "Lupita",
    lastName: "Nyong'o",
    primaryEmail: "sofia.rodriguez@explorers.com",
    phone: "+1 23-555-678-9012",
    agencyId: "agency-4",
    agencyName: "Okavango Explorers",
    assignedSafariPlannerId: "sp-3",
    assignedSafariPlannerName: "Sofia Rodriguez",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-5",
    firstName: "Musa",
    lastName: "Okwonga",
    primaryEmail: "linnea.johansson@global.com",
    phone: "+1 23-555-567-8901",
    agencyId: "agency-5",
    agencyName: "Zambezi Rovers",
    assignedSafariPlannerId: "sp-4",
    assignedSafariPlannerName: "Linnea Johansson",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-6",
    firstName: "Hakim",
    lastName: "Olajuwon",
    primaryEmail: "m.blomkvist@scandinavian.com",
    phone: "+1 23-555-456-7890",
    agencyId: "agency-6",
    agencyName: "Masai Mara Safaris",
    assignedSafariPlannerId: "sp-5",
    assignedSafariPlannerName: "Mikael Blomkvist",
    status: "Inactive",
    ...VERSION_ZERO,
  },
  {
    id: "agent-7",
    firstName: "Imani",
    lastName: "Coppola",
    primaryEmail: "a.earhart@flyhigh.com",
    phone: "+1 23-555-345-6789",
    agencyId: "agency-7",
    agencyName: "Kruger Getaways",
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-8",
    firstName: "Femi",
    lastName: "Adebayo",
    primaryEmail: "bjorn.borg@tennis.com",
    phone: "+1 23-555-234-5678",
    agencyId: "agency-8",
    agencyName: "Etosha Escapes",
    assignedSafariPlannerId: "sp-6",
    assignedSafariPlannerName: "Bjorn Borg",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-9",
    firstName: "Ekon",
    lastName: "Essien",
    primaryEmail: "i.bergman@cinema.com",
    phone: "+1 23-555-876-6789",
    agencyId: "agency-9",
    agencyName: "Africa Treks",
    assignedSafariPlannerId: "sp-7",
    assignedSafariPlannerName: "Ingrid Bergman",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-10",
    firstName: "Daara",
    lastName: "Diop",
    primaryEmail: "s.skarsgard@actors.com",
    phone: "+1 23-555-456-4567",
    agencyId: "agency-10",
    agencyName: "Atlas Mountains Hiking",
    assignedSafariPlannerId: "sp-8",
    assignedSafariPlannerName: "Stellan Skarsgard",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-11",
    firstName: "Chidi",
    lastName: "Okechukwu",
    primaryEmail: "a.vikander@movies.com",
    phone: "+1 23-555-345-3456",
    agencyId: "agency-11",
    agencyName: "Congo River Journeys",
    assignedSafariPlannerId: "sp-9",
    assignedSafariPlannerName: "Alicia Vikander",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-12",
    firstName: "Bantu",
    lastName: "Herrera",
    primaryEmail: "a.vikander@hollywood.com",
    phone: "+1 23-555-222-9876",
    agencyId: "agency-12",
    agencyName: "Madagascar Wonders",
    assignedSafariPlannerId: "sp-9",
    assignedSafariPlannerName: "Alicia Vikander",
    status: "Active",
    ...VERSION_ZERO,
  },
  {
    id: "agent-13",
    firstName: "Aaliyah",
    lastName: "Zulu",
    primaryEmail: "d.umbridge@ministry.com",
    phone: "+1 23-555-999-2345",
    agencyId: "agency-13",
    agencyName: "Namib Desert Treks",
    assignedSafariPlannerId: "sp-10",
    assignedSafariPlannerName: "Dolores Bridge",
    status: "Active",
    ...VERSION_ZERO,
  },
];

// Data getter for use in composed handlers (e.g. agents for an agency)
export const getAgentsByAgencyName = (agencyName: string): MockAgent[] =>
  mockAgents.filter((a) => a.agencyName === agencyName);

// GET /catalog/agents - Fetch all agents
export const getAgents = () => {
  return HttpResponse.json(
    {
      success: true,
      data: mockAgents.map(toAgentDto),
      error: null,
    },
    { status: 200 }
  );
};

// GET /catalog/agents/:id - Fetch single agent by ID
export const getAgent = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agent = mockAgents.find((a) => a.id === id);

  if (!agent) {
    return HttpResponse.json(
      {
        success: false,
        data: null,
        error: "Agent not found",
      },
      { status: 404 }
    );
  }

  return HttpResponse.json(
    {
      success: true,
      data: toAgentDto(agent),
      error: null,
    },
    { status: 200 }
  );
};

/** Request body for PUT /catalog/agents (matches useUpdateAgent UpdateAgentApiPayload) */
type UpdateAgentBody = {
  id: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  alternateEmail?: string;
  phoneNumber: string;
  agencyId: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  language?: string;
  notes?: MockCatalogNote | null;
  currency?: string;
  isActive: boolean;
  version?: number;
};

// PUT /catalog/agents - Update an agent (no id in path; id and fields in body)
export const updateAgent = async (info: { request: Request }) => {
  const { request } = info;
  const body = (await request.json()) as UpdateAgentBody;

  const id = body.id;
  if (!id) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agent ID is required" },
      { status: 400 }
    );
  }

  const agentIndex = mockAgents.findIndex((a) => a.id === id);

  if (agentIndex === -1) {
    return HttpResponse.json(
      {
        success: false,
        data: null,
        error: "Agent not found",
      },
      { status: 404 }
    );
  }

  const prev = mockAgents[agentIndex];
  const updated: MockAgent = {
    ...prev,
    firstName: body.firstName,
    lastName: body.lastName,
    primaryEmail: body.primaryEmail,
    alternateEmail: body.alternateEmail,
    phone: body.phoneNumber,
    agencyId: body.agencyId,
    assignedSafariPlannerId: body.assignedSafariPlannerId,
    assignedSafariPlannerName: body.assignedSafariPlannerName,
    language: body.language,
    notes: body.notes !== undefined ? body.notes : prev.notes,
    currency: body.currency,
    status: body.isActive ? "Active" : "Inactive",
    version: (prev.version ?? 0) + 1,
  };

  mockAgents[agentIndex] = updated;

  return HttpResponse.json(
    {
      success: true,
      data: toAgentDto(updated),
      error: null,
    },
    { status: 200 }
  );
};

// PATCH /catalog/agents/:id/activate - Activate agent
const activateAgent = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agentIndex = mockAgents.findIndex((a) => a.id === id);
  if (agentIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agent not found" },
      { status: 404 }
    );
  }
  mockAgents[agentIndex].status = "Active";
  return HttpResponse.json(
    { success: true, data: toAgentDto(mockAgents[agentIndex]), error: null },
    { status: 200 }
  );
};

// PATCH /catalog/agents/:id/deactivate - Deactivate agent
const deactivateAgent = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agentIndex = mockAgents.findIndex((a) => a.id === id);
  if (agentIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agent not found" },
      { status: 404 }
    );
  }
  mockAgents[agentIndex].status = "Inactive";
  return HttpResponse.json(
    { success: true, data: toAgentDto(mockAgents[agentIndex]), error: null },
    { status: 200 }
  );
};

// DELETE /catalog/agents/:id - Delete an agent
export const deleteAgent = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const agentIndex = mockAgents.findIndex((a) => a.id === id);

  if (agentIndex === -1) {
    return HttpResponse.json(
      {
        success: false,
        data: null,
        error: "Agent not found",
      },
      { status: 404 }
    );
  }

  mockAgents = mockAgents.filter((a) => a.id !== id);

  return new HttpResponse(null, { status: 204 });
};

// POST /agents - Create a new agent
export const createAgent = async (info: { request: Request }) => {
  const body = (await info.request.json()) as {
    firstName: string;
    lastName: string;
    primaryEmail?: string;
    email?: string;
    phoneNumber?: string;
    phone?: string;
    assignedSafariPlannerId?: string;
    assignedSafariPlannerName?: string;
    agencyId?: string;
    notes?: MockCatalogNote | null;
  };

  const newAgent: MockAgent = {
    id: `agent-${Date.now()}`,
    firstName: body.firstName,
    lastName: body.lastName,
    primaryEmail: body.primaryEmail ?? body.email ?? "",
    phone: body.phoneNumber ?? body.phone ?? "",
    agencyId: body.agencyId ?? "",
    assignedSafariPlannerId: body.assignedSafariPlannerId ?? "",
    assignedSafariPlannerName: body.assignedSafariPlannerName ?? "",
    notes: body.notes ?? null,
    status: "Active",
    version: 0,
  };

  mockAgents.push(newAgent);

  return HttpResponse.json(toAgentDto(newAgent), { status: 201 });
};

/** All agent MSW route handlers. Use in handlers.ts: ...agentRoutes(API_BASE_URL) */
export const agentRoutes = (API_BASE_URL: string) => [
  http.post(`${API_BASE_URL}/catalog/agents`, createAgent),
  http.get(`${API_BASE_URL}/catalog/agents`, getAgents),
  http.get(`${API_BASE_URL}/catalog/agents/:id`, getAgent),
  http.put(`${API_BASE_URL}/catalog/agents`, updateAgent),
  http.patch(`${API_BASE_URL}/catalog/agents/:id/activate`, activateAgent),
  http.patch(`${API_BASE_URL}/catalog/agents/:id/deactivate`, deactivateAgent),
  http.delete(`${API_BASE_URL}/catalog/agents/:id`, deleteAgent),
];
