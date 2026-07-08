export function getAgencyCommissionsQueryKey(agencyId?: string | null) {
  return ["agency-commissions", agencyId] as const;
}
