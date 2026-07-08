import { describe, expect, it } from "vitest";

import { normalizeRichTextHtmlForCompare } from "../normalizeRichTextForCompare";

describe("normalizeRichTextHtmlForCompare", () => {
  it("treats empty variants as <p></p>", () => {
    expect(normalizeRichTextHtmlForCompare("")).toBe("<p></p>");
    expect(normalizeRichTextHtmlForCompare("  <p></p>  ")).toBe("<p></p>");
  });

  it("matches server HTML with TipTap output that adds link classes", () => {
    const server =
      '<p><a href="#">Click here for Terms &amp; Conditions</a></p>';
    const tipTapLike = `<p><a href="#" class="text-[color:var(--link)] underline underline-offset-2 decoration-[color:var(--link)] cursor-text">Click here for Terms &amp; Conditions</a></p>`;
    expect(normalizeRichTextHtmlForCompare(server)).toBe(
      normalizeRichTextHtmlForCompare(tipTapLike)
    );
  });

  it("matches same markup with or without class/style on nested tags", () => {
    const minimal = '<p><a href="https://example.com">Link</a></p>';
    const withAttrs =
      '<p><a href="https://example.com" class="x" style="color:red">Link</a></p>';
    expect(normalizeRichTextHtmlForCompare(minimal)).toBe(
      normalizeRichTextHtmlForCompare(withAttrs)
    );
  });

  it("matches when editor adds target/rel on links", () => {
    const server = '<p><a href="https://example.com">Link</a></p>';
    const withLinkAttrs =
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a></p>';
    expect(normalizeRichTextHtmlForCompare(server)).toBe(
      normalizeRichTextHtmlForCompare(withLinkAttrs)
    );
  });
});
