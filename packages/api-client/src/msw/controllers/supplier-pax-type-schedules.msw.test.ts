import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("supplierPaxTypeScheduleRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const { supplierPaxTypeScheduleRoutes } =
      await import("./supplier-pax-type-schedules");

    server = setupServer(...supplierPaxTypeScheduleRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("lists seeded supplier schedules newest first", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/pax-type-schedules`
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      validFrom: string;
      paxTypes: Array<{ isAdult: boolean; canDeactivate: boolean }>;
    }>;

    expect(body.map((schedule) => schedule.validFrom)).toEqual([
      "2026-01-01",
      "2025-01-01",
      "2024-01-01",
    ]);
    expect(body[0].paxTypes).toHaveLength(4);
    expect(body[0].paxTypes[0]).toEqual(
      expect.objectContaining({ isAdult: true, canDeactivate: false })
    );
  });

  it("creates and persists a supplier schedule", async () => {
    const createResponse = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-2/pax-type-schedules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: "sup-2",
          validFrom: "2026-01-01",
          validTo: null,
          paxTypes: [
            {
              name: "Adult",
              paxType: "Adult",
              ageFrom: 18,
              ageTo: 999,
              isActive: true,
            },
            {
              name: "Child",
              paxType: "Child",
              ageFrom: 2,
              ageTo: 17,
              isActive: true,
            },
            {
              name: "Infant",
              paxType: "Infant",
              ageFrom: null,
              ageTo: null,
              isActive: false,
            },
            {
              name: "Teen",
              paxType: "Teen",
              ageFrom: null,
              ageTo: null,
              isActive: false,
            },
          ],
        }),
      }
    );

    expect(createResponse.status).toBe(201);

    const listResponse = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-2/pax-type-schedules`
    );
    const list = (await listResponse.json()) as Array<{ validFrom: string }>;
    expect(list).toHaveLength(1);
    expect(list[0].validFrom).toBe("2026-01-01");
  });

  it("updates ValidTo and increments version", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/pax-type-schedules/sup-1-pax-schedule-2026`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: "sup-1",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          version: 1,
          paxTypes: [
            {
              name: "Adult",
              paxType: "Adult",
              ageFrom: 18,
              ageTo: 999,
              isActive: true,
            },
          ],
        }),
      }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      validTo: string;
      version: number;
    };
    expect(body.validTo).toBe("2026-12-31");
    expect(body.version).toBe(2);
  });

  it("returns documented validation and conflict messages", async () => {
    const validationResponse = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/pax-type-schedules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: "sup-1",
          validFrom: "2026-06-01",
          validTo: "2026-05-31",
          paxTypes: [],
        }),
      }
    );
    expect(validationResponse.status).toBe(422);
    await expect(validationResponse.json()).resolves.toMatchObject({
      message: "End date must be on or after start date.",
    });

    const overlapResponse = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/pax-type-schedules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: "sup-1",
          validFrom: "2026-01-01",
          validTo: null,
          paxTypes: [
            {
              name: "Adult",
              paxType: "Adult",
              ageFrom: 18,
              ageTo: 999,
              isActive: true,
            },
            {
              name: "Child",
              paxType: "Child",
              ageFrom: 2,
              ageTo: 11,
              isActive: true,
            },
            {
              name: "Teen",
              paxType: "Teen",
              ageFrom: 11,
              ageTo: 17,
              isActive: true,
            },
          ],
        }),
      }
    );
    expect(overlapResponse.status).toBe(422);
    await expect(overlapResponse.json()).resolves.toMatchObject({
      message: "Age ranges must not overlap across active Pax Types.",
    });

    const conflictResponse = await fetch(
      `${ORIGIN}/api/catalog/pax-type-schedules/sup-1-pax-schedule-2026`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: "sup-1",
          validFrom: "2026-01-01",
          validTo: null,
          version: 99,
          paxTypes: [],
        }),
      }
    );
    expect(conflictResponse.status).toBe(409);
    await expect(conflictResponse.json()).resolves.toMatchObject({
      message:
        "This PAX Configuration was updated by another user. Refresh and try again.",
    });
  });
});
