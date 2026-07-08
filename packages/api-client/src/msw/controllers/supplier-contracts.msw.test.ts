import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("supplierContractRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const { supplierContractRoutes } = await import("./supplier-contracts");

    server = setupServer(...supplierContractRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("lists supplier contracts sorted by Valid From descending with agency scope fields", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/contracts`
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      data: Array<{
        name: string;
        agencyGroupId: string | null;
        agencyGroupName: string | null;
        validFrom: string;
      }>;
    };

    expect(body.data.map((contract) => contract.validFrom)).toEqual([
      "2026-01-01",
      "2025-01-01",
      "2024-01-01",
      "2023-01-01",
    ]);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        agencyGroupId: "ag-1",
        agencyGroupName: "AAConsultants",
      })
    );
    expect(body.data.some((contract) => contract.agencyGroupId === null)).toBe(
      true
    );
  });

  it("rejects duplicate contract names per supplier across scopes", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/contracts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Elewana Contract 2025",
          agencyGroupId: "ag-3",
          validFrom: "2027-01-01",
          validTo: "2027-12-31",
        }),
      }
    );

    expect(response.status).toBe(409);

    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("already exists");
  });

  it("rejects same-scope overlapping contract dates", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/contracts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "ANY 2025 Overlap",
          agencyGroupId: null,
          validFrom: "2025-06-01",
          validTo: "2025-06-30",
        }),
      }
    );

    expect(response.status).toBe(409);

    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("Elewana Contract 2025");
    expect(body.message).toContain("2025-01-01 - 2025-12-31");
  });

  it("allows overlapping dates across different agency scopes", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/contracts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "RAgent 2025",
          agencyGroupId: "ag-3",
          validFrom: "2025-06-01",
          validTo: "2025-06-30",
        }),
      }
    );

    expect(response.status).toBe(201);

    const body = (await response.json()) as {
      agencyGroupId: string | null;
      agencyGroupName: string | null;
      isActive: boolean;
    };
    expect(body).toEqual(
      expect.objectContaining({
        agencyGroupId: "ag-3",
        agencyGroupName: "RAgent",
        isActive: false,
      })
    );
  });

  it("rejects agency scope updates on saved contracts", async () => {
    const response = await fetch(`${ORIGIN}/api/catalog/contracts/contract-1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agencyGroupId: "ag-1",
      }),
    });

    expect(response.status).toBe(409);

    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("Agency Group cannot be changed");
  });

  it("creates cancellation policies with multiple travel date ranges", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/contracts/contract-1/cancellation-policies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyName: "Festive Cancellation",
          description: "Festive travel rules",
          refundable: false,
          travelDates: [
            { dateFrom: "2025-12-01", dateTo: "2025-12-15" },
            { dateFrom: "2025-12-16", dateTo: null },
          ],
          conditions: [],
        }),
      }
    );

    expect(response.status).toBe(201);

    const body = (await response.json()) as Array<{
      policyName: string;
      travelDates: Array<{
        id: string;
        version: number;
        dateFrom: string;
        dateTo: string | null;
      }>;
    }>;
    const createdPolicy = body.find(
      (policy) => policy.policyName === "Festive Cancellation"
    );

    expect(createdPolicy?.travelDates).toEqual([
      expect.objectContaining({
        dateFrom: "2025-12-01",
        dateTo: "2025-12-15",
      }),
      expect.objectContaining({ dateFrom: "2025-12-16", dateTo: null }),
    ]);
  });

  it("rejects cancellation policy travel ranges outside contract validity", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/contracts/contract-1/cancellation-policies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyName: "Out of Bounds",
          description: "Invalid travel rules",
          refundable: false,
          travelDates: [{ dateFrom: "2024-12-15", dateTo: "2025-01-15" }],
          conditions: [],
        }),
      }
    );

    expect(response.status).toBe(400);

    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("within contract validity period");
  });

  it("rejects overlapping cancellation policy travel ranges", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/suppliers/contracts/contract-1/cancellation-policies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyName: "Overlapping Policy",
          description: "Invalid travel rules",
          refundable: false,
          travelDates: [
            { dateFrom: "2025-06-01", dateTo: "2025-07-15" },
            { dateFrom: "2025-07-01", dateTo: null },
          ],
          conditions: [],
        }),
      }
    );

    expect(response.status).toBe(400);

    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("must not overlap");
  });
});
