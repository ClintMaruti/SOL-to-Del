/** Maps Zod issue paths to TanStack Form deep field keys (e.g. `contracted.travelDates[0].travelFrom`). */
export function zodPathToTanStackFieldKey(
  path: readonly (string | number)[]
): string {
  let s = "";
  for (const seg of path) {
    if (typeof seg === "number") {
      s += `[${seg}]`;
    } else {
      s += s === "" ? String(seg) : `.${String(seg)}`;
    }
  }
  return s;
}
