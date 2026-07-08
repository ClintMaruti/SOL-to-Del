import { i18n } from "@sol/i18n";

/** Returns a user-facing error message or undefined when valid. */
export function validateFutureUpliftInput(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return i18n.t("validation.futureUpliftRequired", { ns: "admin" });
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return i18n.t("validation.futureUpliftInvalidNumber", { ns: "admin" });
  }
  if (n <= 0) {
    return i18n.t("validation.futureUpliftMustBePositive", { ns: "admin" });
  }
  return undefined;
}

export function parseFutureUpliftNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
