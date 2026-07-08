import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { loginSubmitSchema } from "../model/schema";
import {
  useLoginForm,
  validateEmail,
  validatePassword,
} from "../model/useLoginForm";

describe("useLoginForm", () => {
  const noop = vi.fn();

  describe("Initial State", () => {
    it("should initialize with empty form data", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      expect(result.current.form.state.values.email).toBe("");
      expect(result.current.form.state.values.password).toBe("");
    });

    it("should initialize with no general error", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      expect(result.current.generalError).toBeUndefined();
    });
  });

  describe("Field updates", () => {
    it("should update email field", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      act(() => {
        result.current.form.setFieldValue("email", "test@example.com");
      });

      expect(result.current.form.state.values.email).toBe("test@example.com");
    });

    it("should update password field", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      act(() => {
        result.current.form.setFieldValue("password", "password123");
      });

      expect(result.current.form.state.values.password).toBe("password123");
    });
  });

  describe("reset", () => {
    it("should reset form data to initial state", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      act(() => {
        result.current.form.setFieldValue("email", "test@example.com");
        result.current.form.setFieldValue("password", "password123");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.form.state.values.email).toBe("");
      expect(result.current.form.state.values.password).toBe("");
    });

    it("should clear general error when reset", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      act(() => {
        result.current.setGeneralError("Some error");
      });

      expect(result.current.generalError).toBe("Some error");

      act(() => {
        result.current.reset();
      });

      expect(result.current.generalError).toBeUndefined();
    });
  });

  describe("setGeneralError", () => {
    it("should set general error message", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      act(() => {
        result.current.setGeneralError("Login failed");
      });

      expect(result.current.generalError).toBe("Login failed");
    });

    it("should overwrite existing general error", () => {
      const { result } = renderHook(() => useLoginForm(noop));

      act(() => {
        result.current.setGeneralError("First error");
      });

      expect(result.current.generalError).toBe("First error");

      act(() => {
        result.current.setGeneralError("Second error");
      });

      expect(result.current.generalError).toBe("Second error");
    });
  });
});

describe("validateEmail", () => {
  it("should return error for empty email", () => {
    expect(validateEmail("")).toBe("Email is required");
  });

  it("should return error for whitespace-only email", () => {
    expect(validateEmail("   ")).toBe("Email is required");
  });

  it("should return error for invalid email format", () => {
    expect(validateEmail("invalid-email")).toBe(
      "Please enter a valid email address"
    );
  });

  it("should return undefined for valid email", () => {
    expect(validateEmail("test@example.com")).toBeUndefined();
  });

  it("should accept valid email formats", () => {
    const validEmails = [
      "user@example.com",
      "test.user@example.co.uk",
      "user+tag@example.com",
      "user_name@example-domain.com",
    ];

    validEmails.forEach((email) => {
      expect(validateEmail(email)).toBeUndefined();
    });
  });

  it("should reject invalid email formats", () => {
    const invalidEmails = [
      "invalid",
      "@example.com",
      "user@",
      "user@example",
      "user @example.com",
      "user@exam ple.com",
    ];

    invalidEmails.forEach((email) => {
      expect(validateEmail(email)).toBe("Please enter a valid email address");
    });
  });

  it("should handle very long email addresses", () => {
    const longEmail = "a".repeat(100) + "@example.com";
    expect(validateEmail(longEmail)).toBeUndefined();
  });
});

describe("validatePassword", () => {
  it("should return error for empty password", () => {
    expect(validatePassword("")).toBe("Password is required");
  });

  it("should return error for whitespace-only password", () => {
    expect(validatePassword("   ")).toBe("Password is required");
  });

  it("should return undefined for valid password", () => {
    expect(validatePassword("password123")).toBeUndefined();
  });

  it("should handle special characters in password", () => {
    expect(validatePassword("p@ssw0rd!@#$%")).toBeUndefined();
  });
});

describe("loginSubmitSchema", () => {
  it("should parse valid login data", () => {
    const result = loginSubmitSchema.parse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should trim email whitespace", () => {
    const result = loginSubmitSchema.parse({
      email: "  test@example.com  ",
      password: "password123",
    });

    expect(result.email).toBe("test@example.com");
  });
});
