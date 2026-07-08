import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("contentBlocksRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const {
      contentBlocksRoutes,
      resetContentBlocksMockState,
      setContentBlocksListForce500,
      setContentBlocksMockData,
    } = await import("./content-blocks");

    resetContentBlocksMockState();
    setContentBlocksListForce500(false);
    setContentBlocksMockData([
      {
        id: "cb-a",
        title: "Alpha",
        body: "<p>Hello</p>",
        templates: ["Quote"],
        version: 1,
      },
    ]);

    server = setupServer(...contentBlocksRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("GET returns a non-empty list", async () => {
    const response = await fetch(`${ORIGIN}/api/catalog/content-blocks`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: boolean;
      data: Array<{ id: string; title: string }>;
    };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET returns an empty array when mock data is empty", async () => {
    const { setContentBlocksMockData } = await import("./content-blocks");
    setContentBlocksMockData([]);

    const response = await fetch(`${ORIGIN}/api/catalog/content-blocks`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: boolean;
      data: unknown[];
    };
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("GET returns 500 when force flag is set", async () => {
    const { setContentBlocksListForce500 } = await import("./content-blocks");
    setContentBlocksListForce500(true);

    const response = await fetch(`${ORIGIN}/api/catalog/content-blocks`);
    expect(response.status).toBe(500);
  });

  it("POST 201 prepends a new block to the list", async () => {
    const before = await fetch(`${ORIGIN}/api/catalog/content-blocks`);
    const beforeBody = (await before.json()) as {
      data: Array<{ id: string; title: string }>;
    };
    const firstBefore = beforeBody.data[0]?.id;

    const post = await fetch(`${ORIGIN}/api/catalog/content-blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Block", body: "<p>x</p>" }),
    });
    expect(post.status).toBe(201);

    const after = await fetch(`${ORIGIN}/api/catalog/content-blocks`);
    const afterBody = (await after.json()) as {
      data: Array<{ id: string; title: string }>;
    };
    expect(afterBody.data[0]?.title).toBe("New Block");
    expect(afterBody.data[0]?.id).not.toBe(firstBefore);
  });
});
