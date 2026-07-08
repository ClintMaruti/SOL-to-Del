import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("itinerariesRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const { itinerariesRoutes, resetItinerariesMockState } =
      await import("./itineraries");

    resetItinerariesMockState();
    server = setupServer(...itinerariesRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  async function search(body: Record<string, unknown>) {
    return fetch(`${ORIGIN}/api/itinerary/itineraries/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns items and total", async () => {
    const response = await search({
      pageSize: 50,
      sortBy: "None",
      sortDirection: "Asc",
    });

    expect(response.status).toBe(200);

    const bodyJson = (await response.json()) as {
      items: Array<{ id: string }>;
      total: number;
    };

    expect(bodyJson.total).toBe(42);
    expect(bodyJson.items).toHaveLength(42);
  });

  it("filters by agencyIds", async () => {
    const response = await search({
      pageSize: 50,
      sortBy: "None",
      sortDirection: "Asc",
      agencyIds: ["agency-1"],
    });

    expect(response.status).toBe(200);

    const bodyJson = (await response.json()) as {
      items: Array<{ agency: string }>;
      total: number;
    };

    expect(
      bodyJson.items.every((i) => i.agency === "Kilimanjaro Experts")
    ).toBe(true);
    expect(bodyJson.total).toBeLessThan(42);
  });

  it("filters by search substring", async () => {
    const response = await search({
      pageSize: 50,
      sortBy: "None",
      sortDirection: "Asc",
      search: "AN1235",
    });

    expect(response.status).toBe(200);

    const bodyJson = (await response.json()) as {
      items: Array<{ crmReferenceNumber: string }>;
      total: number;
    };

    expect(bodyJson.total).toBeGreaterThanOrEqual(1);
    expect(
      bodyJson.items.every((i) => i.crmReferenceNumber.includes("1235"))
    ).toBe(true);
  });

  it("creates an itinerary and persists it into the list", async () => {
    const createResponse = await fetch(`${ORIGIN}/api/itinerary/itineraries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crmReferenceNumber: "AN9999",
        travelDateFrom: "2026-05-01",
        travelDateTo: "2026-05-10",
        agencyId: "agency-2",
        agentId: "agent-2",
        leadTravelerName: "David Smith",
        adultsCount: 2,
        childrenCount: 0,
        infantsCount: 0,
        destinations: ["kenya", "amboseli"],
      }),
    });

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as {
      id: string;
      crmReferenceNumber: string;
      agency: string;
      agent: string | null;
    };

    expect(created.id).toBeTruthy();
    expect(created).toMatchObject({
      crmReferenceNumber: "AN9999",
      agency: "Serengeti Adventures",
      agent: "Jomo Kenyatta",
    });

    const listResponse = await search({
      pageSize: 50,
      sortBy: "None",
      sortDirection: "Asc",
      search: "AN9999",
    });
    const listBody = (await listResponse.json()) as {
      items: Array<{ id: string; crmReferenceNumber: string }>;
      total: number;
    };

    expect(listBody.total).toBe(1);
    expect(listBody.items[0]).toMatchObject({
      id: created.id,
      crmReferenceNumber: "AN9999",
    });
  });

  it("returns field validation errors for invalid create requests", async () => {
    const response = await fetch(`${ORIGIN}/api/itinerary/itineraries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crmReferenceNumber: "",
        travelDateFrom: "2026-05-10",
        travelDateTo: "2026-05-01",
        agencyId: "agency-1",
        agentId: "agent-2",
        adultsCount: 0,
        childrenCount: 0,
        infantsCount: 0,
        destinations: [],
      }),
    });

    expect(response.status).toBe(422);

    const body = (await response.json()) as {
      errors: Record<string, string[]>;
    };

    expect(body.errors).toMatchObject({
      CrmReferenceNumber: expect.any(Array),
      AgencyId: expect.any(Array),
      AgentId: expect.any(Array),
      TravelDateTo: expect.any(Array),
      Destinations: expect.any(Array),
      AdultsCount: expect.any(Array),
    });
  });
});
