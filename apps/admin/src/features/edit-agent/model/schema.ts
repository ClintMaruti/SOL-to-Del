import { i18n } from "@sol/i18n";
import { z } from "zod";

import type { AgentStatus } from "@/entities/agent/model/types";

const agentStatuses = ["Active", "Inactive"] as const;

/**
 * Zod schema for edit-agent form submission.
 * Trims strings and converts empty optional fields to `undefined`.
 */
export const editAgentSubmitSchema = z
  .object({
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    primaryEmail: z.string().trim(),
    alternateEmail: z.string().trim(),
    phone: z.string().trim(),
    agencyId: z.string(),
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
    language: z.string().trim(),
    notes: z.string().trim(),
    currency: z.string().trim(),
    status: z.enum(agentStatuses),
  })
  .transform((data) => ({
    firstName: data.firstName,
    lastName: data.lastName,
    primaryEmail: data.primaryEmail,
    alternateEmail: data.alternateEmail || undefined,
    phone: data.phone,
    agencyId: data.agencyId,
    assignedSafariPlannerId: data.assignedSafariPlannerId,
    assignedSafariPlannerName: data.assignedSafariPlannerName,
    language: data.language || undefined,
    notes: data.notes || undefined,
    currency: data.currency || undefined,
    status: data.status as AgentStatus,
  }));

export type EditAgentSubmitData = z.output<typeof editAgentSubmitSchema>;
