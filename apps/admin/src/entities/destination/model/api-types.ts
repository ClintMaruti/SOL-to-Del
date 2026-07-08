import type { DestinationType } from "./types";

/**
 * API response item for destinations (locations) from /api/catalog/locations
 * Response is a direct array (no wrapper)
 */
export interface DestinationApiItem {
  id: string;
  parentId: string | null;
  name: string;
  type: DestinationType;
  code: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  version: number;
  isPreferred?: boolean;
}

/**
 * Request body for PUT /api/catalog/locations (id in body)
 */
export interface UpdateLocationRequest {
  id: string;
  name: string;
  type: DestinationType;
  code: string;
  parentId: string | null;
  latitude: number | null;
  longitude: number | null;
  isPreferred?: boolean;
}

/**
 * Response type for PUT /api/catalog/locations (200 OK)
 * Same structure as DestinationApiItem
 */
export type UpdateLocationResponse = DestinationApiItem;
