export type ApiRow = Record<string, unknown>;

export function str(row: ApiRow, camel: string, pascal: string): string {
  const a = row[camel];
  const b = row[pascal];
  if (typeof a === "string") return a;
  if (typeof b === "string") return b;
  return "";
}

export function bool(row: ApiRow, camel: string, pascal: string): boolean {
  const a = row[camel];
  const b = row[pascal];
  if (typeof a === "boolean") return a;
  if (typeof b === "boolean") return b;
  return false;
}

export function nullableStr(
  row: ApiRow,
  camel: string,
  pascal: string
): string | null {
  const a = row[camel];
  const b = row[pascal];
  if (typeof a === "string") return a;
  if (typeof b === "string") return b;
  if (a === null || b === null) return null;
  return null;
}

export function num(row: ApiRow, camel: string, pascal: string): number {
  const a = row[camel];
  const b = row[pascal];
  if (typeof a === "number" && Number.isFinite(a)) return a;
  if (typeof b === "number" && Number.isFinite(b)) return b;
  return 0;
}

export function toApiRow(raw: unknown): ApiRow {
  return typeof raw === "object" && raw !== null ? (raw as ApiRow) : {};
}
