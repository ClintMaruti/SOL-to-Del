import { api, useQuery } from "@sol/api-client";

export interface ServiceOption {
  id: string;
  title: string;
  includes?: string;
  excludes?: string;
}

export interface ServiceSearchResult {
  id: string;
  name: string;
  supplierName: string;
  supplierId: string;
  type?: string;
  notes?: string;
  priceFrom?: number;
  chargeType?: string;
  paxMin?: number;
  paxMax?: number;
  unitsMin?: number;
  unitsMax?: number;
  minNights?: number | null;
  minAge?: number;
  specialAllocationRules?: boolean;
  options?: ServiceOption[];
}

export function useServiceSearch(query: string, supplierId?: string | null) {
  return useQuery<ServiceSearchResult[]>({
    queryKey: ["service-search", query, supplierId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (supplierId) params.set("supplierId", supplierId);
      const data = await api.get<ServiceSearchResult[]>(
        `/catalog/services/search?${params}`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: true,
  });
}
