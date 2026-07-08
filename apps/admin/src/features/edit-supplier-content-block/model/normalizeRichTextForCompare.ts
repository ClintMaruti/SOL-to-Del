/**
 * Normalize rich-text HTML for equality checks (dirty detection).
 * Strips editor-injected attributes (TipTap Link: class, rel, target, data-*)
 * so API HTML matches what the editor outputs after parse without user edits.
 */
export function normalizeRichTextHtmlForCompare(html: string): string {
  const trimmed = html.trim();
  if (trimmed === "" || trimmed === "<p></p>") {
    return "<p></p>";
  }

  const stripViaDom = (): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, "text/html");
      doc.body.querySelectorAll("*").forEach((el) => {
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          if (
            name === "class" ||
            name === "style" ||
            name.startsWith("data-")
          ) {
            el.removeAttribute(attr.name);
          }
        }
        if (el.tagName === "A") {
          el.removeAttribute("target");
          el.removeAttribute("rel");
        }
      });
      doc.body
        .querySelectorAll("br.ProseMirror-trailingBreak")
        .forEach((br) => {
          br.remove();
        });
      let out = doc.body.innerHTML.trim().replace(/\u00A0/g, " ");
      const emptyParagraph = /^<p>\s*<\/p>$/i.test(out.replace(/\s/g, ""));
      if (emptyParagraph) {
        return "<p></p>";
      }
      return out;
    } catch {
      return trimmed;
    }
  };

  if (typeof document !== "undefined") {
    return stripViaDom();
  }

  return trimmed
    .replace(/\sclass="[^"]*"/g, "")
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/\srel="[^"]*"/g, "")
    .replace(/\starget="[^"]*"/g, "")
    .replace(/\sdata-[a-z-]+="[^"]*"/gi, "")
    .trim()
    .replace(/\u00A0/g, " ");
}
