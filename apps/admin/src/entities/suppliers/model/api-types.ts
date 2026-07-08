import type { Supplier } from "./types";

/**
 * API response shape for GET /api/catalog/suppliers (or equivalent).
 *
 * Each item in the array matches the Supplier domain model.
 */
export type SupplierListResponse = Supplier[];

/**
 * API response shape for GET /api/catalog/suppliers/:id (or equivalent).
 */
export type SupplierResponse = Supplier;
