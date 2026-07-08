import { i18n } from "@sol/i18n";

/**
 * Shorthand for `i18n.t(key, { ns: "admin", ...opts })`.
 * Use in non-React code (schemas, utils) that needs admin-namespace translations.
 */
export const tAdmin = (key: string, opts?: Record<string, unknown>) =>
  i18n.t(key, { ns: "admin", ...opts });

/**
 * Shared validation messages used across all admin forms.
 * Uses i18n for translations — field names passed to `required()` should already be translated.
 */
export const VALIDATION_MESSAGES = {
  required: (field: string) =>
    i18n.t("validation.required", { ns: "admin", field }),
  time24HourFormat: (field: string) =>
    i18n.t("validation.time24HourFormat", { ns: "admin", field }),
  time12HourFormat: (field: string) =>
    i18n.t("validation.time12HourFormat", { ns: "admin", field }),
  timeFromTimeToPair: () =>
    i18n.t("validation.timeFromTimeToPair", { ns: "admin" }),
  get invalidEmail() {
    return i18n.t("validation.invalidEmail", { ns: "admin" });
  },
  get latitude() {
    return i18n.t("validation.latitude", { ns: "admin" });
  },
  get longitude() {
    return i18n.t("validation.longitude", { ns: "admin" });
  },
  get agentZoneIdRequired() {
    return i18n.t("validation.agentZoneIdRequired", { ns: "admin" });
  },
  get whiteLabelNoteRequired() {
    return i18n.t("validation.whiteLabelNoteRequired", { ns: "admin" });
  },
} as const;
