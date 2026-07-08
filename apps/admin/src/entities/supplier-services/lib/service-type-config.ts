import type { LucideIcon } from "lucide-react";
import {
  Car,
  DollarSign,
  FootprintsIcon,
  Hotel,
  Package,
  Plane,
} from "lucide-react";

import type { ServiceTypeValue } from "../types";

/** Configuration for a service type (icon and color). Replace colors with Figma values from node 3954-54874 when available. */
export interface ServiceTypeConfig {
  icon: LucideIcon;
  color: string;
  borderColor: string;
  backgroundColor: string;
}

const serviceTypeConfigs: Record<ServiceTypeValue, ServiceTypeConfig> = {
  accommodation: {
    icon: Hotel,
    color: "text-emerald-600",
    borderColor: "border-emerald-400",
    backgroundColor: "bg-emerald-100",
  },
  activity: {
    icon: FootprintsIcon,
    color: "text-violet-600",
    borderColor: "border-violet-400",
    backgroundColor: "bg-violet-100",
  },
  transportation: {
    icon: Car,
    color: "text-yellow-600",
    borderColor: "border-yellow-400",
    backgroundColor: "bg-yellow-100",
  },
  flight: {
    icon: Plane,
    color: "text-sky-600",
    borderColor: "border-sky-400",
    backgroundColor: "bg-sky-100",
  },
  fee: {
    icon: DollarSign,
    color: "text-amber-600",
    borderColor: "border-amber-400",
    backgroundColor: "bg-amber-100",
  },
  other: {
    icon: Package,
    color: "text-slate-700",
    borderColor: "border-slate-500",
    backgroundColor: "bg-slate-200",
  },
};

/**
 * Gets icon and color configuration for a service type.
 * @param serviceType - The service type value
 * @returns Configuration object with icon and color (falls back to "other" for unknown types)
 */
export function getServiceTypeConfig(
  serviceType: string | undefined
): ServiceTypeConfig {
  return (
    serviceTypeConfigs?.[serviceType as ServiceTypeValue] ??
    serviceTypeConfigs.other
  );
}
