import { describe, expect, it } from "vitest";

import { htmlToPlainTextPreview } from "../htmlToPlainTextPreview";

describe("htmlToPlainTextPreview", () => {
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

  it("adds space between adjacent block headings", () => {
    expect(
      htmlToPlainTextPreview(
        "<h1>Some Header</h1><h2>Sub Header</h2><p>Test</p>"
      )
    ).toBe("Some Header Sub Header Test");
  });

  it("returns empty string for blank input", () => {
    expect(htmlToPlainTextPreview("   ")).toBe("");
  });
});
