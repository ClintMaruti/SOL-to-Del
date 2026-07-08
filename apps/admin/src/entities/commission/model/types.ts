/**
 * Agency commission row returned by
 * GET /catalog/agencies/{agencyId}/commissions.
 */
export interface Commission {
  id: string;
  agencyId: string;
  /** ISO date string (yyyy-mm-dd) */
  effectiveFrom: string;
  commissionPercent: number;
  version: number;
}
