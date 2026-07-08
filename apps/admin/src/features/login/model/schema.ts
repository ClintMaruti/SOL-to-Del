import { z } from "zod";

/**
 * Zod schema for login form submission.
 * Parses and validates form values into API-ready payload.
 */
export const loginSubmitSchema = z.object({
  email: z.string().trim(),
  password: z.string(),
});

export type LoginSubmitData = z.output<typeof loginSubmitSchema>;
