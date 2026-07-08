import type { EntityStatus } from "../types";

export function entityStatusToBoolean(status: EntityStatus) {
  if (status === "Active") return true;
  return false;
}
