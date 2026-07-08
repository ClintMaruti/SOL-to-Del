import type { Agent } from "../model/types";

type CreateAgentOptions = Partial<
  Omit<Agent, "id" | "firstName" | "lastName">
> & {
  agencyGroup?: string | null;
};

/**
 * Factory function to create mock Agent objects for testing (API shape)
 */
export const createAgent = (
  id: string,
  firstName: string,
  lastName: string,
  options?: CreateAgentOptions
): Agent => ({
  id,
  version: options?.version ?? 0,
  firstName,
  lastName,
  primaryEmail: options?.primaryEmail ?? `${id}@test.com`,
  phoneNumber: options?.phoneNumber ?? "+1 23-555-000-0000",
  isActive: options?.isActive ?? true,
  agencyId: options?.agencyId ?? "agency-1",
  agencyName: options?.agencyName ?? "Test Agency",
  assignedSafariPlannerId: options?.assignedSafariPlannerId ?? "sp-1",
  assignedSafariPlannerName:
    options?.assignedSafariPlannerName ?? "Erik Karlsson",
  alternateEmail: options?.alternateEmail,
  agencyGroups:
    options?.agencyGroups ??
    (options?.agencyGroup
      ? [{ id: options.agencyGroup, name: options.agencyGroup }]
      : [{ id: "group-1", name: "Test Agency Group" }]),
  language: options?.language,
  notes: options?.notes,
  currency: options?.currency,
});
