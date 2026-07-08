import type { LucideIcon } from "lucide-react";

export type DestinationType =
  | "Country"
  | "Region"
  | "Area"
  | "City"
  | "Airport";

export type DestinationStatus = "Active" | "Inactive";

export interface DestinationCoordinates {
  lat: number;
  lng: number;
}

export interface Destination {
  id: string;
  name: string;
  type: DestinationType;
  children?: Destination[];
  code?: string;
  coordinates?: DestinationCoordinates;
  status?: DestinationStatus;
  /** Catalog flag for Country rows only; UI may cascade a star under preferred countries. */
  isPreferred?: boolean;
}

export interface DestinationTypeOption {
  icon: LucideIcon;
  label: DestinationType;
  color: string;
}
export interface ParentDestinationOption {
  id: string;
  name: string;
  type: DestinationType;
  parent?: string;
}
