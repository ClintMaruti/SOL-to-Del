/**
 * Normalizes API validation payloads into a single `Record<field, messages[]>` shape.
 * Supports:
 * - ASP.NET-style `{ errors: { Field: ["msg"] } }` / `Errors` with string or string[] values
 * - Legacy array `[{ propertyName, errorMessage }]`
 */
export function normalizeValidationErrorsFromBody(
  data: unknown
): Record<string, string[]> | undefined {
  if (data == null) {
    return undefined;
  }

  if (Array.isArray(data)) {
    const out: Record<string, string[]> = {};
    for (const item of data) {
      if (
        item &&
        typeof item === "object" &&
        "errorMessage" in item &&
        typeof (item as { errorMessage?: unknown }).errorMessage === "string"
      ) {
        const msg = (item as { errorMessage: string }).errorMessage.trim();
        if (!msg) continue;
        const propRaw = (item as { propertyName?: unknown }).propertyName;
        const prop =
          typeof propRaw === "string" && propRaw.trim()
            ? propRaw.trim()
            : "Request";
        if (!out[prop]) out[prop] = [];
        out[prop].push(msg);
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  if (typeof data !== "object") {
    return undefined;
  }

  const body = data as Record<string, unknown>;
  const rawErrors = (body.Errors ?? body.errors) as
    | Record<string, string[] | string>
    | undefined;

  if (!rawErrors || typeof rawErrors !== "object" || Array.isArray(rawErrors)) {
    return undefined;
  }

  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(rawErrors)) {
    if (Array.isArray(v)) {
      const msgs = v.filter((x): x is string => typeof x === "string");
      if (msgs.length > 0) out[k] = msgs;
    } else if (typeof v === "string" && v.trim()) {
      out[k] = [v.trim()];
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
