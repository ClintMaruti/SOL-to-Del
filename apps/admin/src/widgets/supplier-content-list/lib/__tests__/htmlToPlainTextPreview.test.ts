import { describe, expect, it } from "vitest";

import { htmlToPlainTextPreview } from "../htmlToPlainTextPreview";

describe("htmlToPlainTextPreview (supplier content list)", () => {
  it("strips tags and keeps visible words", () => {
    expect(htmlToPlainTextPreview("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world"
    );
  });

  it("does not leave angle-bracket fragments in output", () => {
    const out = htmlToPlainTextPreview("<p>One</p><p>Two</p>");
    expect(out).not.toMatch(/</);
    expect(out).toContain("One");
    expect(out).toContain("Two");
  });

  it("returns empty string for blank input", () => {
    expect(htmlToPlainTextPreview("   ")).toBe("");
  });
});
