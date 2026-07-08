import { api, useQuery } from "@sol/api-client";

import {
  normalizeSupplierPaxTypeSchedule,
  sortSupplierPaxTypeSchedules,
  type SupplierPaxTypeSchedule,
  type SupplierPaxTypeScheduleDto,
} from "../model/types";

import { supplierPaxTypeSchedulesQueryKey } from "./queryKeys";

export function useSupplierPaxTypeSchedules(
  supplierId: string | null | undefined
) {
  return useQuery<SupplierPaxTypeSchedule[]>({
    queryKey: supplierPaxTypeSchedulesQueryKey(supplierId),
    queryFn: async () => {
      if (!supplierId) return [];
      const data = await api.get<SupplierPaxTypeScheduleDto[]>(
        `/catalog/suppliers/${supplierId}/pax-type-schedules`
      );
      return sortSupplierPaxTypeSchedules(
        Array.isArray(data) ? data.map(normalizeSupplierPaxTypeSchedule) : []
      );
    },
    enabled: Boolean(supplierId),
    placeholderData: [],
  });
}
