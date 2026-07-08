import { describe, expect, it } from "vitest";

import { zodPathToTanStackFieldKey } from "../zod-tanstack-path";

describe("zodPathToTanStackFieldKey", () => {
  it("maps contracted travel date paths", () => {
    expect(
      zodPathToTanStackFieldKey(["contracted", "travelDates", 0, "travelFrom"])
    ).toBe("contracted.travelDates[0].travelFrom");
  });

  it("maps top-level keys", () => {
    expect(zodPathToTanStackFieldKey(["title"])).toBe("title");
  });
});
