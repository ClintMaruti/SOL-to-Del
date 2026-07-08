import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("supplierRoutes — supplier content blocks", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const { supplierRoutes, resetSupplierContentBlocksMockState } =
      await import("./suppliers");

    resetSupplierContentBlocksMockState();
    server = setupServer(...supplierRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("GET list returns 200 with bodyPreview for a known supplier", async () => {
    const res = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/content-blocks`
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ id: string; bodyPreview: string; version: number }>;
    };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(typeof body.data[0].bodyPreview).toBe("string");
  });

  it("GET list returns 404 for unknown supplier", async () => {
    const res = await fetch(
      `${ORIGIN}/api/catalog/suppliers/unknown-supplier-id/content-blocks`
    );
    expect(res.status).toBe(404);
  });

  it("GET detail returns 200 for a known block", async () => {
    const res = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/content-blocks/sup-1-about`
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { id: string; body: string; version: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("sup-1-about");
  });

  it("GET detail returns 404 for unknown content block id", async () => {
    const res = await fetch(
      `${ORIGIN}/api/catalog/suppliers/sup-1/content-blocks/no-such-block`
    );
    expect(res.status).toBe(404);
  });

  it("PUT updates body when version matches", async () => {
    const put = await fetch(
      `${ORIGIN}/api/catalog/supplier-content-blocks/sup-1-about`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: "<p>Updated</p>",
          version: 1,
        }),
      }
    );
    expect(put.status).toBe(200);
    const json = (await put.json()) as {
      success: boolean;
      data: { body: string; version: number };
    };
    expect(json.success).toBe(true);
    expect(json.data.body).toBe("<p>Updated</p>");
    expect(json.data.version).toBe(2);
  });

  it("PUT returns 409 when version does not match", async () => {
    const put = await fetch(
      `${ORIGIN}/api/catalog/supplier-content-blocks/sup-2-about`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: "<p>X</p>",
          version: 999,
        }),
      }
    );
    expect(put.status).toBe(409);
  });
});
