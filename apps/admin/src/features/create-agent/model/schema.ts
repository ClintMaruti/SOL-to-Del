import { i18n } from "@sol/i18n";
import { z } from "zod";

import { toCatalogNoteDtoForApi } from "@/entities/catalog-extra";

/**
 * Zod schema for create agent form submission.
 * Parses form data (AgentFormData shape) into the API request body (CreateAgentRequest).
 * UserId is taken from the authenticated user's NameIdentifier claim, not from the body.
 */
export const createAgentSubmitSchema = z
  .object({
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    primaryEmail: z.string().trim(),
    alternateEmail: z.string().trim(),
    phone: z.string().trim(),
    agencyId: z.string().trim(),
    assignedSafariPlannerId: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.assignedSafariPlanner", { ns: "admin" }),
        })
      ),
    assignedSafariPlannerName: z
      .string()
      .trim()
      .min(
        1,
        i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("labels.assignedSafariPlanner", { ns: "admin" }),
        })
      ),
    notes: z.string().trim(),
  })
  .transform((data) => ({
    agencyId: data.agencyId,
    assignedSafariPlannerId: data.assignedSafariPlannerId,
    assignedSafariPlannerName: data.assignedSafariPlannerName,
    firstName: data.firstName,
    lastName: data.lastName,
    primaryEmail: data.primaryEmail,
    alternateEmail: data.alternateEmail || undefined,
    phoneNumber: data.phone,
    notes: toCatalogNoteDtoForApi(undefined, data.notes) ?? undefined,
  }));

export type CreateAgentSubmitData = z.output<typeof createAgentSubmitSchema>;
