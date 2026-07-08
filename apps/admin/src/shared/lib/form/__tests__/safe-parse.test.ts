import { describe, expect, it } from "vitest";
import { z } from "zod";

import { safeParseSubmitData } from "../safe-parse";

const testSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    age: z.number().min(0, "Age must be positive"),
  })
  .transform((data) => ({
    ...data,
    name: data.name.trim(),
  }));

describe("safeParseSubmitData", () => {
  it("should return success with transformed data for valid input", () => {
    const result = safeParseSubmitData(testSchema, {
      name: "  Jane Doe  ",
      email: "jane@example.com",
      age: 30,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      age: 30,
    });
  });

  it("should return failure with field-level message for invalid field", () => {
    const result = safeParseSubmitData(testSchema, {
      name: "",
      email: "not-an-email",
      age: -1,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeDefined();
    expect(result.message).toContain("Name is required");
    expect(result.message).toContain("Invalid email");
    expect(result.message).toContain("Age must be positive");
  });

  it("should return a human-readable message on failure", () => {
    const result = safeParseSubmitData(testSchema, {
      name: "",
      email: "valid@example.com",
      age: 10,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.message).toBe("Name is required");
  });

  it("should include form-level errors from .refine()", () => {
    const schemaWithRefine = z
      .object({
        password: z.string(),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords must match",
      });

    const result = safeParseSubmitData(schemaWithRefine, {
      password: "abc",
      confirmPassword: "xyz",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.message).toContain("Passwords must match");
  });

  it("should include each repeated validation message only once", () => {
    const schemaWithDuplicateMessages = z.object({
      ranges: z
        .array(
          z.object({
            from: z.string(),
          })
        )
        .superRefine((_ranges, ctx) => {
          ctx.addIssue({
            code: "custom",
            message: "Ranges must not overlap",
            path: [0, "from"],
          });
          ctx.addIssue({
            code: "custom",
            message: "Ranges must not overlap",
            path: [1, "from"],
          });
        }),
    });

    const result = safeParseSubmitData(schemaWithDuplicateMessages, {
      ranges: [{ from: "2026-01-01" }, { from: "2026-01-15" }],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.message).toBe("Ranges must not overlap");
  });

  it("should provide a fallback message when flatten produces nothing", () => {
    // This is a safeguard test — in practice flatten always has messages
    // when safeParse fails, but the fallback covers edge cases.
    const alwaysFailSchema = z.any().refine(() => false, {
      message: "Always fails",
    });

    const result = safeParseSubmitData(alwaysFailSchema, "anything");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.message.length).toBeGreaterThan(0);
  });
});
