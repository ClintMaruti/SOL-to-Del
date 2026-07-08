import type { SupplierHeadOffice } from "./types";

/**
 * Raw API response shape for head office endpoints.
 * Backend uses phoneNumber; we normalize to phone in the entity.
 */
export type SupplierHeadOfficeApiResponse = SupplierHeadOffice;

/**
 * Request body for POST /api/catalog/head-offices (create).
 */
export type CreateHeadOfficeApiRequestPayload = Omit<
  SupplierHeadOffice,
  "id" | "suppliersCount" | "isActive"
>;
/**
 * Request body for PATCH /api/catalog/head-offices/:id (update).
 */
export type UpdateHeadOfficeApiPayload = Omit<
  SupplierHeadOffice,
  "suppliersCount"
>;

/**
 * API response shape for GET /api/catalog/head-offices
 *
 * Each item in the array matches the SupplierHeadOffice domain model
 */
export type SupplierHeadOfficeListResponse = SupplierHeadOffice[];

/**
 * API response shape for GET /api/catalog/head-offices/:id
 */
export type SupplierHeadOfficeResponse = SupplierHeadOffice;
