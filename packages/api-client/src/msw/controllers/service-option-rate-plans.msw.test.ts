import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("serviceOptionRatePlansRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();
    const { serviceOptionRatePlansRoutes } =
      await import("./service-option-rate-plans");
    server = setupServer(...serviceOptionRatePlansRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("POST create then GET list includes the new rate plan", async () => {
    const listUrl = `${ORIGIN}/api/catalog/suppliers/services/options/option-1/rate-plans`;

    const postRes = await fetch(listUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Created via MSW",
        validityDateFrom: "2026-01-01",
        validityDateTo: "2026-12-31",
        payAtProperty: false,
      }),
    });
    expect(postRes.status).toBe(201);
    const createdBody = (await postRes.json()) as {
      success: boolean;
      data: { id: string };
    };
    expect(createdBody.success).toBe(true);
    const newId = createdBody.data.id;

    const getRes = await fetch(listUrl);
    expect(getRes.status).toBe(200);
    const listBody = (await getRes.json()) as {
      success: boolean;
      data: { id: string }[];
    };
    expect(listBody.success).toBe(true);
    const ids = listBody.data.map((p) => p.id);
    expect(ids).toContain(newId);
    expect(ids).toContain("rp-1");
  });
});
