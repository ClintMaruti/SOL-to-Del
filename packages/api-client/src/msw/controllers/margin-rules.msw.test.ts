import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("marginRulesRoutes", () => {
  let server: ReturnType<typeof setupServer>;
  const createPayload = {
    agencyGroupId: "ag-1",
    serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
    supplierId: null,
    serviceId: null,
    optionId: null,
    validFrom: "2027-01-01",
    validTo: "2027-12-31",
    marginPercent: 21.5,
  };

  beforeEach(async () => {
    vi.resetModules();

    const { marginRulesRoutes, resetMarginRulesMockState } =
      await import("./margin-rules");

    resetMarginRulesMockState();
    server = setupServer(...marginRulesRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("returns the first page with totalCount, a nextCursor, and expired rules visible by default", async () => {
    const response = await fetch(`${ORIGIN}/api/catalog/margin-rules`);

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      items: Array<{ validTo: string }>;
      nextCursor: string | null;
      totalCount: number;
    };

    expect(body.items).toHaveLength(50);
    expect(body.totalCount).toBeGreaterThan(50);
    expect(body.nextCursor).not.toBeNull();
    expect(body.items.some((item) => item.validTo < "2026-04-16")).toBe(true);
  });

  it("uses the cursor to return the next non-overlapping page while keeping totalCount stable", async () => {
    const firstPageResponse = await fetch(`${ORIGIN}/api/catalog/margin-rules`);
    const firstPageBody = (await firstPageResponse.json()) as {
      items: Array<{ id: string }>;
      nextCursor: string;
      totalCount: number;
    };

    const secondPageResponse = await fetch(
      `${ORIGIN}/api/catalog/margin-rules?cursor=${encodeURIComponent(
        firstPageBody.nextCursor
      )}`
    );
    const secondPageBody = (await secondPageResponse.json()) as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
      totalCount: number;
    };

    expect(secondPageResponse.status).toBe(200);
    expect(secondPageBody.totalCount).toBe(firstPageBody.totalCount);
    expect(secondPageBody.items).toHaveLength(50);
    expect(secondPageBody.items[0]?.id).not.toBe(firstPageBody.items[0]?.id);
  });

  it("filters by search and exact margin percent", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/margin-rules?search=elewana&marginPercent=14&hideExpired=true`
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      items: Array<{
        supplierName: string | null;
        optionName: string | null;
        marginPercent: number;
      }>;
      totalCount: number;
    };

    expect(body.totalCount).toBe(1);
    expect(body.items).toEqual([
      expect.objectContaining({
        supplierName: "Elewana Lodges & Camps",
        optionName: "Full Board",
        marginPercent: 14,
      }),
    ]);
  });

  it("applies overlap date filtering and can include expired rules when hideExpired is false", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/margin-rules?agencyGroupId=ag-1&supplierId=sup-1&hideExpired=false&validFrom=2025-06-01&validTo=2025-06-30`
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      items: Array<{ validFrom: string; validTo: string }>;
      totalCount: number;
    };

    expect(body.totalCount).toBe(1);
    expect(body.items).toEqual([
      expect.objectContaining({
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
      }),
    ]);
  });

  it("creates a new rule and returns it in subsequent list responses without refetch-specific behavior", async () => {
    const response = await fetch(`${ORIGIN}/api/catalog/margin-rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    expect(response.status).toBe(201);

    const createdRule = (await response.json()) as {
      id: string;
      version: number;
      agencyGroupId: string;
      serviceTypeName: string | null;
      marginPercent: number;
    };

    expect(createdRule).toEqual(
      expect.objectContaining({
        agencyGroupId: "ag-1",
        serviceTypeName: "Accommodation",
        marginPercent: 21.5,
        version: 1,
      })
    );

    const listResponse = await fetch(
      `${ORIGIN}/api/catalog/margin-rules?agencyGroupId=ag-1&validFrom=2027-06-01&validTo=2027-06-30`
    );
    const listBody = (await listResponse.json()) as {
      items: Array<{ id: string }>;
    };

    expect(listBody.items.some((item) => item.id === createdRule.id)).toBe(
      true
    );
  });

  it("updates a future rule and increments its version", async () => {
    const createResponse = await fetch(`${ORIGIN}/api/catalog/margin-rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });
    const createdRule = (await createResponse.json()) as {
      id: string;
      version: number;
    };

    const updateResponse = await fetch(
      `${ORIGIN}/api/catalog/margin-rules/${createdRule.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...createPayload,
          validTo: "2027-11-30",
          marginPercent: 24,
          version: createdRule.version,
        }),
      }
    );

    expect(updateResponse.status).toBe(200);

    const updatedRule = (await updateResponse.json()) as {
      validTo: string;
      marginPercent: number;
      version: number;
    };

    expect(updatedRule).toEqual(
      expect.objectContaining({
        validTo: "2027-11-30",
        marginPercent: 24,
        version: createdRule.version + 1,
      })
    );
  });

  it("returns a 409 conflict for exact duplicate scope and date ranges", async () => {
    await fetch(`${ORIGIN}/api/catalog/margin-rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    const duplicateResponse = await fetch(
      `${ORIGIN}/api/catalog/margin-rules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPayload),
      }
    );

    expect(duplicateResponse.status).toBe(409);

    const duplicateBody = (await duplicateResponse.json()) as {
      message: string;
    };

    expect(duplicateBody.message).toBe(
      "Rule already exists. Adjust the conditions to proceed."
    );
  });

  it("deletes a future rule and removes it from later responses", async () => {
    const createResponse = await fetch(`${ORIGIN}/api/catalog/margin-rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });
    const createdRule = (await createResponse.json()) as {
      id: string;
    };

    const deleteResponse = await fetch(
      `${ORIGIN}/api/catalog/margin-rules/${createdRule.id}`,
      {
        method: "DELETE",
      }
    );

    expect(deleteResponse.status).toBe(204);

    const listResponse = await fetch(
      `${ORIGIN}/api/catalog/margin-rules?agencyGroupId=ag-1&validFrom=2027-06-01&validTo=2027-06-30`
    );
    const listBody = (await listResponse.json()) as {
      items: Array<{ id: string }>;
    };

    expect(listBody.items.some((item) => item.id === createdRule.id)).toBe(
      false
    );
  });
});
