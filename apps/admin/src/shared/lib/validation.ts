import { i18n } from "@sol/i18n";
import { z } from "zod";

// ─── Phone (E.164) ───────────────────────────────────────────────────────────

/** E.164: "+" followed by 7–15 digits, first digit non-zero. */
export const INTL_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

const PHONE_EMPTY = (v: string) => !v || v === "+";

/**
 * TanStack Form `onChange` validator for phone fields.
 * Skips validation when empty (so it doesn't nag mid-typing),
 * but rejects invalid E.164 format.
 */
export function phoneOnChangeValidator(
  formatMessage: string
): (opts: { value: string }) => string | undefined {
  return ({ value }) => {
    const v = value.trim();
    if (PHONE_EMPTY(v)) return undefined;
    if (!INTL_PHONE_REGEX.test(v)) return formatMessage;
    return undefined;
  };
}

/**
 * TanStack Form `onSubmit` validator for required phone fields.
 * Rejects empty values; format is assumed to be caught by `onChange`.
 */
export function phoneOnSubmitValidator(
  requiredMessage: string
): (opts: { value: string }) => string | undefined {
  return ({ value }) => {
    const v = value.trim();
    if (PHONE_EMPTY(v)) return requiredMessage;
    return undefined;
  };
}

/**
 * Validates a phone string imperatively (for non-TanStack forms).
 * Returns an error message or `undefined` if valid.
 */
export function validatePhone(
  value: string,
  messages: { required: string; format: string }
): string | undefined {
  const v = value.trim();
  if (PHONE_EMPTY(v)) return messages.required;
  if (!INTL_PHONE_REGEX.test(v)) return messages.format;
  return undefined;
}

/**
 * Zod schema for a required E.164 phone string.
 * Use in submit schemas (e.g. `createSupplierHeadOfficeSubmitSchema`).
 */
export function phoneRequiredSchema(messages: {
  required: string;
  format: string;
}) {
  return z
    .string()
    .trim()
    .refine((v) => !PHONE_EMPTY(v), messages.required)
    .refine((v) => PHONE_EMPTY(v) || INTL_PHONE_REGEX.test(v), messages.format);
}

// ─── Postal code ─────────────────────────────────────────────────────────────

const POSTAL_MIN = 4;
const POSTAL_MAX = 7;

/**
 * Zod schema for an optional postal code (4–7 alphanumeric characters when provided).
 * Use in both inline validators and submit schemas.
 */
export function postalCodeSchema(messages?: { min?: string; max?: string }) {
  const minMsg =
    messages?.min ??
    i18n.t("validation.postalCodeMinLength", { ns: "admin", min: POSTAL_MIN });
  const maxMsg =
    messages?.max ??
    i18n.t("validation.postalCodeMaxLength", { ns: "admin", max: POSTAL_MAX });
  return z.union([
    z.literal(""),
    z.string().min(POSTAL_MIN, minMsg).max(POSTAL_MAX, maxMsg),
  ]);
}

export const emailSchema = (maxLength: number = 64) =>
  z
    .email({ error: i18n.t("admin:validation.invalidEmail") })
    .max(
      maxLength,
      i18n.t("admin:validation.emailMaxLength", { max: maxLength })
    );
