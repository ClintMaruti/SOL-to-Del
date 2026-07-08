import { describe, expect, it } from "vitest";

import { type SupplierContentBlockDetailApi, mapDetailFromApi } from "./types";

describe("mapDetailFromApi", () => {
  it("uses content when body and html are empty", () => {
    const detail = mapDetailFromApi({
      id: "b1",
      title: "About",
      version: 1,
      content: "<p>from content</p>",
    });
    expect(detail.body).toBe("<p>from content</p>");
  });

  it("prefers body over other fields", () => {
    const detail = mapDetailFromApi({
      id: "b1",
      version: 1,
      body: "<p>first</p>",
      content: "<p>second</p>",
    });
    expect(detail.body).toBe("<p>first</p>");
  });

  it("reads PascalCase Body from API", () => {
    const payload = {
      id: "b1",
      version: 1,
      Body: "<p>Pascal</p>",
    } as unknown as SupplierContentBlockDetailApi;
    const detail = mapDetailFromApi(payload);
    expect(detail.body).toBe("<p>Pascal</p>");
  });
});
