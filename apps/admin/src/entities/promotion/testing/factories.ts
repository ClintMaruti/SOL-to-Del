import type { Promotion } from "../model/types";

export function createPromotion(
  id: string,
  name: string,
  options?: Partial<Omit<Promotion, "id" | "name">>
): Promotion {
  return {
    id,
    name,
    headOfficeId: options?.headOfficeId ?? "sho-1",
    bookingWindowFrom: options?.bookingWindowFrom ?? "2027-01-01",
    bookingWindowTo: options?.bookingWindowTo ?? "2027-12-31",
    isActive: options?.isActive ?? true,
  };
}
