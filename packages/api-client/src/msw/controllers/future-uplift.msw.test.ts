import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("futureUpliftRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const { futureUpliftRoutes, resetFutureUpliftMock } =
      await import("./future-uplift");

    resetFutureUpliftMock();
    server = setupServer(...futureUpliftRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("GET returns null percent and version then PATCH updates and increments version", async () => {
    const getInitial = await fetch(`${ORIGIN}/api/catalog/future-uplift`);
    expect(getInitial.status).toBe(200);
    const initialBody = (await getInitial.json()) as {
      futureUpliftPercent: number | null;
      version: number;
    };
    expect(initialBody.futureUpliftPercent).toBeNull();
    expect(initialBody.version).toBe(1);

    const putRes = await fetch(`${ORIGIN}/api/catalog/future-uplift`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        futureUpliftPercent: 15,
        version: initialBody.version,
      }),
    });
    expect(putRes.status).toBe(200);
    const putBody = (await putRes.json()) as {
      futureUpliftPercent: number | null;
      version: number;
    };
    expect(putBody.futureUpliftPercent).toBe(15);
    expect(putBody.version).toBe(2);

    const getAfter = await fetch(`${ORIGIN}/api/catalog/future-uplift`);
    const afterBody = (await getAfter.json()) as {
      futureUpliftPercent: number | null;
      version: number;
    };
    expect(afterBody.futureUpliftPercent).toBe(15);
    expect(afterBody.version).toBe(2);
  });
});
