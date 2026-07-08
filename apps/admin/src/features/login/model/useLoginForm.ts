import { i18n } from "@sol/i18n";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { safeParseSubmitData } from "@/shared/lib/form";
import { VALIDATION_MESSAGES } from "@/shared/ui/form";

import { loginSubmitSchema, type LoginSubmitData } from "./schema";

export interface LoginFormValues {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
};

/**
 * Validates email field:
 * - Required
 * - Must match email format
 */
export function validateEmail(value: string): string | undefined {
  if (!value.trim()) {
    return VALIDATION_MESSAGES.required(
      i18n.t("labels.email", { ns: "admin" })
    );
  }
  if (!EMAIL_REGEX.test(value)) {
    return VALIDATION_MESSAGES.invalidEmail;
  }
  return undefined;
}

/**
 * Validates password field:
 * - Required
 */
export function validatePassword(value: string): string | undefined {
  if (!value.trim()) {
    return VALIDATION_MESSAGES.required(
      i18n.t("labels.password", { ns: "admin" })
    );
  }
  return undefined;
}

/**
 * Creates a TanStack Form instance for the Login form.
 *
 * - Field-level UI validation is handled by built-in TanStack Form validators.
 * - Submit-time data transformation is handled by the Zod schema.
 * - General errors (e.g., API failures) are managed via `generalError` state.
 */
export function useLoginForm(onSubmit: (data: LoginSubmitData) => void) {
  const [generalError, setGeneralError] = useState<string | undefined>();

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Clear general error on new submit attempt
      setGeneralError(undefined);
      const result = safeParseSubmitData(loginSubmitSchema, value);
      if (!result.success) {
        setGeneralError(result.message);
        return;
      }
      onSubmit(result.data);
    },
  });

  const reset = () => {
    form.reset();
    setGeneralError(undefined);
  };

  return {
    form,
    generalError,
    setGeneralError,
    reset,
    validators: {
      email: validateEmail,
      password: validatePassword,
    },
  };
}
