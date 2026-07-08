/**
 * Payment term status: inactive terms cannot be assigned to suppliers in future flows.
 */
export type PaymentTermStatus = "Active" | "Inactive";

/**
 * Frontend domain model for PaymentTerm.
 *
 * Reusable payment term definitions; many Supplier entities can reference one PaymentTerm.
 *
 * Length constraints (enforced by API/validation; not by this type):
 * - name: max 100
 * - description: text (no fixed limit)
 */
export interface PaymentTerm {
  /** Internal PK; not exposed to UI. */
  id: string;

  /** Human-readable name (e.g. "Net 30", "Prepaid", "On Arrival"). Unique, mandatory. Max length 100. */
  name: string;

  /** Optional longer description (conditions, notes). Nullable. */
  description: string | null;

  /** Number of days for due-date logic (e.g. "Net X days"). Mandatory, non-negative (>= 0). */
  days: number;

  /** Whether this term can be assigned to suppliers. Mandatory. */
  status: PaymentTermStatus;

  /** Soft delete: when true, record is considered deleted. Default false. */
  isDeleted: boolean;

  /** Set when soft-deleted; null otherwise. */
  deletedAt: string | null;

  /** User/system that performed soft delete; optional per project convention. */
  deletedBy?: string;
}
