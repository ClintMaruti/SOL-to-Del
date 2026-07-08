import type { AgencyGroupSummary } from "@/entities/agency-group";

import type { Agency } from "../model/types";

export type AgencyApiResponse = Omit<
  Agency,
  "agencyGroupIds" | "agencyGroups"
> & {
  agencyGroupIds?: string[] | null;
  agencyGroups?: AgencyGroupSummary[] | null;
  /** Legacy read fields kept only for compatibility while API responses settle. */
  agencyGroupId?: string | null;
  agencyGroupName?: string | null;
};

function uniqueStrings(
  values: readonly unknown[] | null | undefined
): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function normalizeAgencyGroups(
  groups: readonly AgencyGroupSummary[] | null | undefined
): AgencyGroupSummary[] {
  if (!Array.isArray(groups)) return [];

  const byId = new Map<string, AgencyGroupSummary>();
  for (const group of groups) {
    const id = typeof group?.id === "string" ? group.id.trim() : "";
    if (!id) continue;

    const name =
      typeof group?.name === "string" && group.name.trim()
        ? group.name.trim()
        : id;
    const existing = byId.get(id);
    if (!existing || existing.name === existing.id) {
      byId.set(id, { id, name });
    }
  }

  return [...byId.values()].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    });
    return byName || a.id.localeCompare(b.id);
  });
}

export function normalizeAgency(agency: AgencyApiResponse): Agency {
  const groupsById = new Map<string, AgencyGroupSummary>();

  for (const group of normalizeAgencyGroups(agency.agencyGroups)) {
    groupsById.set(group.id, group);
  }

  const ids = uniqueStrings(agency.agencyGroupIds);
  const legacyGroupId =
    typeof agency.agencyGroupId === "string" ? agency.agencyGroupId.trim() : "";
  if (legacyGroupId) ids.push(legacyGroupId);

  for (const id of ids) {
    if (groupsById.has(id)) continue;
    const legacyName =
      id === legacyGroupId && typeof agency.agencyGroupName === "string"
        ? agency.agencyGroupName.trim()
        : "";
    groupsById.set(id, { id, name: legacyName || id });
  }

  const agencyGroups = normalizeAgencyGroups([...groupsById.values()]);

  return {
    ...agency,
    agencyGroups,
    agencyGroupIds: agencyGroups.map((group) => group.id),
  };
}

export function normalizeAgencies(
  agencies: readonly AgencyApiResponse[] | null | undefined
): Agency[] {
  if (!Array.isArray(agencies)) return [];
  return agencies.map(normalizeAgency);
}
