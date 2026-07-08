import type { PaymentTerm } from "./types";

/**
 * API response shape for GET /api/catalog/payment-terms (or equivalent).
 *
 * Each item in the array matches the PaymentTerm domain model.
 */
export type PaymentTermListResponse = PaymentTerm[];

/**
 * API response shape for GET /api/catalog/payment-terms/:id (or equivalent).
 */
export type PaymentTermResponse = PaymentTerm;
