import type { SupplierService } from "@/entities/supplier-services/types";

export function getServiceLabel(s: SupplierService): string {
  return s.serviceName ?? s.name;
}

export function filterServicesByQuery(
  services: SupplierService[],
  query: string
): SupplierService[] {
  const q = query.trim().toLowerCase();
  if (!q) return services;
  return services.filter((s) => getServiceLabel(s).toLowerCase().includes(q));
}
