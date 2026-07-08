import { useMemo } from "react";

/**
 * Returns the text with matching portions highlighted as JSX.
 */
export function useHighlightMatch(text: string | undefined, query?: string) {
  return useMemo(() => {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 3) return text;

    if (!text) return "";

    // Escape special regex characters in the search query
    const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === trimmed.toLowerCase()) {
        return (
          <span
            key={index}
            className="bg-brand-background-info font-semibold inline rounded-sm"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, [text, query]);
}
