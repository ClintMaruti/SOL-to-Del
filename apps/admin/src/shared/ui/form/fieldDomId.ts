/**
 * Stable DOM `id` / `name` for a field. Use when multiple TanStack forms on one page
 * share the same field paths (e.g. several rate-rule cards) so ids must be namespaced.
 */
export function fieldDomId(
  htmlIdPrefix: string | undefined,
  name: string
): string {
  return htmlIdPrefix ? `${htmlIdPrefix}__${name}` : name;
}
