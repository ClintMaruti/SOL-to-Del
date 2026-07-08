import { http, HttpResponse } from "msw";
import type { MockAgency } from "./agencies";

interface MockAgencyGroup {
  id: string;
  name: string;
  description: string | null;
  agencyCount: number;
  isActive: boolean;
  version: number;
  agencies?: MockAgency[];
}

/** Catalog `AgencyGroup` DTO (matches admin entity). */
function toAgencyGroupDto(g: MockAgencyGroup) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    isActive: g.isActive,
    numberOfAgencies: g.agencyCount,
    version: g.version,
  };
}

export function getMockAgencyGroupById(id: string) {
  const group = mockAgencyGroups.find((g) => g.id === id);
  return group ? toAgencyGroupDto(group) : null;
}

// Mock agency groups data (mutable for DELETE handler)
let mockAgencyGroups: MockAgencyGroup[] = [
  {
    id: "ag-1",
    name: "AAConsultants",
    description: "Internal group",
    agencyCount: 2,
    isActive: true,
    version: 0,
  },
  {
    id: "ag-2",
    name: "AngamaSpecial",
    description: "Wholesale group",
    agencyCount: 2,
    isActive: true,
    version: 0,
  },
  {
    id: "ag-3",
    name: "RAgent",
    description: null,
    agencyCount: 2,
    isActive: true,
    version: 0,
  },
  {
    id: "ag-4",
    name: "WHAgent",
    description: "Big group",
    agencyCount: 3,
    isActive: true,
    version: 0,
  },
  {
    id: "ag-5",
    name: "ZooGroup",
    description: null,
    agencyCount: 1,
    isActive: true,
    version: 0,
  },
  {
    id: "ag-6",
    name: "StandaloneGroup",
    description: "No agencies - for E2E delete test",
    agencyCount: 0,
    isActive: false,
    version: 0,
  },
];

const getAgencyGroups = () => {
  return HttpResponse.json(
    {
      success: true,
      data: mockAgencyGroups.map(toAgencyGroupDto),
      error: null,
    },
    { status: 200 }
  );
};

const deleteAgencyGroup = ({ params }: { params: { id: string } }) => {
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const found = mockAgencyGroups.some((g) => g.id === id);
  if (!found) {
    return HttpResponse.json(
      { success: false, error: "Agency group not found", data: null },
      { status: 404 }
    );
  }
  mockAgencyGroups = mockAgencyGroups.filter((g) => g.id !== id);
  return new HttpResponse(null, { status: 204 });
};

const createAgencyGroup = async ({ request }: { request: Request }) => {
  const body = await request.json();
  const newAgencyGroup: MockAgencyGroup = {
    id: `ag-${mockAgencyGroups.length + 1}`,
    name: body.name,
    description: body.description,
    agencyCount: 0,
    isActive: true,
    version: 0,
  };
  mockAgencyGroups.push(newAgencyGroup);
  return HttpResponse.json(
    { success: true, data: toAgencyGroupDto(newAgencyGroup), error: null },
    { status: 201 }
  );
};

const updateAgencyGroupById = async ({
  params,
  request,
}: {
  params: { id: string };
  request: Request;
}) => {
  const rawId = params.id;
  const id = typeof rawId === "string" ? rawId : rawId?.[0];
  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    version?: number;
    agencies?: string[];
  };
  const index = mockAgencyGroups.findIndex((g) => g.id === id);
  if (index === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency group not found" },
      { status: 404 }
    );
  }
  if (body.name !== undefined) mockAgencyGroups[index].name = body.name;
  if ("description" in body)
    mockAgencyGroups[index].description = body.description ?? null;
  if (body.isActive !== undefined)
    mockAgencyGroups[index].isActive = body.isActive;
  if (body.agencies !== undefined)
    mockAgencyGroups[index].agencyCount = body.agencies.length;
  mockAgencyGroups[index].version = (mockAgencyGroups[index].version ?? 0) + 1;
  return HttpResponse.json(
    {
      success: true,
      data: toAgencyGroupDto(mockAgencyGroups[index]),
      error: null,
    },
    { status: 200 }
  );
};

const activateAgencyGroup = ({ params }: { params: { id: string } }) => {
  const index = mockAgencyGroups.findIndex((g) => g.id === params.id);
  if (index === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency group not found" },
      { status: 404 }
    );
  }
  mockAgencyGroups[index].isActive = true;
  mockAgencyGroups[index].version = (mockAgencyGroups[index].version ?? 0) + 1;
  return HttpResponse.json(
    {
      success: true,
      data: toAgencyGroupDto(mockAgencyGroups[index]),
      error: null,
    },
    { status: 200 }
  );
};

const deactivateAgencyGroup = ({ params }: { params: { id: string } }) => {
  const index = mockAgencyGroups.findIndex((g) => g.id === params.id);
  if (index === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency group not found" },
      { status: 404 }
    );
  }
  mockAgencyGroups[index].isActive = false;
  mockAgencyGroups[index].version = (mockAgencyGroups[index].version ?? 0) + 1;
  return HttpResponse.json(
    {
      success: true,
      data: toAgencyGroupDto(mockAgencyGroups[index]),
      error: null,
    },
    { status: 200 }
  );
};

const getAgencyGroupById = ({ params }: { params: { id: string } }) => {
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const found = mockAgencyGroups.find((g) => g.id === id);
  if (!found) {
    return HttpResponse.json(
      { success: false, data: null, error: "Agency group not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(
    { success: true, data: toAgencyGroupDto(found), error: null },
    { status: 200 }
  );
};

export const agencyGroupRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/agency-groups`, getAgencyGroups),
  http.get(`${API_BASE_URL}/catalog/agency-groups/:id`, getAgencyGroupById),
  http.delete(`${API_BASE_URL}/catalog/agency-groups/:id`, deleteAgencyGroup),
  http.post(`${API_BASE_URL}/catalog/agency-groups`, createAgencyGroup),
  http.put(`${API_BASE_URL}/catalog/agency-groups/:id`, (info) =>
    updateAgencyGroupById({
      params: { id: String(info.params.id ?? info.params["id"]) },
      request: info.request,
    })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/agency-groups/:id/activate`,
    activateAgencyGroup
  ),
  http.patch(
    `${API_BASE_URL}/catalog/agency-groups/:id/deactivate`,
    deactivateAgencyGroup
  ),
];
