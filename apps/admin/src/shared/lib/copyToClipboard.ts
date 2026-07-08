import { toast } from "@sol/ui";

/**
 * Copies the given text to the clipboard.
 * Uses the Clipboard API; does not throw on failure (fire-and-forget).
 */
export function copyToClipboard(text: string, message?: string): void {
  try {
    navigator.clipboard.writeText(text);
    toast.success(message || "Copied to clipboard");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to copy to clipboard"
    );
  }
}
