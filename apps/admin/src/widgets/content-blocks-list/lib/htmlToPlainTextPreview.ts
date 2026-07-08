/**
 * Plain text for the Content Blocks list "Text" column (feature-local).
 * Uses the DOM so tags/entities are handled consistently — no raw HTML in the UI.
 */

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Insert gaps between block elements so adjacent headings/paragraphs are not glued. */
function insertBlockBoundarySpaces(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(
      /<\/(address|article|blockquote|div|footer|h[1-6]|header|li|main|nav|ol|p|pre|section|table|tbody|td|th|thead|tr|ul)\s*>/gi,
      "$& "
    )
    .replace(
      /(<(?:address|article|blockquote|div|footer|h[1-6]|header|li|main|nav|ol|p|pre|section|table|tbody|td|th|thead|tr|ul)(?:\s[^>]*)?>)/gi,
      " $1"
    );
}

function stripHtmlFallback(html: string): string {
  const normalized = insertBlockBoundarySpaces(html.trim());
  const withoutBlocks = normalized
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  const withoutTags = withoutBlocks.replace(/<[^>]+>/g, " ");
  return collapseWhitespace(
    withoutTags
      .replace(/&nbsp;/gi, " ")
      .replace(/&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

export function htmlToPlainTextPreview(html: string): string {
  const raw = html.trim();
  if (raw === "") {
    return "";
  }

  const normalized = insertBlockBoundarySpaces(raw);

  if (typeof document === "undefined") {
    return stripHtmlFallback(normalized);
  }

  try {
    const doc = new DOMParser().parseFromString(
      `<div data-rt-preview-root="1">${normalized}</div>`,
      "text/html"
    );
    const root = doc.querySelector("[data-rt-preview-root]");
    const text = (root?.textContent ?? doc.body.textContent ?? "").trim();
    return collapseWhitespace(text);
  } catch {
    return stripHtmlFallback(normalized);
  }
}
