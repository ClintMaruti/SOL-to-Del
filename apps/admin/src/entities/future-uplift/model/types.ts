/** GET / PATCH response for tenant Future Uplift (CompanySettings). */
export interface FutureUpliftConfigDto {
  futureUpliftPercent: number | null;
  version: number;
}

export interface FutureUpliftPatchPayload {
  futureUpliftPercent: number;
  version: number;
}
