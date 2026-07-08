import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  normalizeSupplierPaxTypeSchedule,
  sortSupplierPaxTypeSchedules,
  type CreateSupplierPaxTypeSchedulePayload,
  type SupplierPaxTypeSchedule,
  type SupplierPaxTypeScheduleDto,
} from "../model/types";

import { supplierPaxTypeSchedulesQueryKey } from "./queryKeys";

export function useCreateSupplierPaxTypeSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      ...body
    }: CreateSupplierPaxTypeSchedulePayload): Promise<SupplierPaxTypeSchedule> => {
      const data = await api.post<SupplierPaxTypeScheduleDto>(
        `/catalog/suppliers/${supplierId}/pax-type-schedules`,
        { supplierId, ...body }
      );
      return normalizeSupplierPaxTypeSchedule(data);
    },
    onSuccess: (created, variables) => {
      queryClient.setQueryData<SupplierPaxTypeSchedule[]>(
        supplierPaxTypeSchedulesQueryKey(variables.supplierId),
        (previous) =>
          sortSupplierPaxTypeSchedules([
            created,
            ...(Array.isArray(previous) ? previous : []),
          ])
      );
      toast.success(
        i18n.t("supplierPaxConfigurations.createdSuccess", { ns: "admin" })
      );
      queryClient.invalidateQueries({
        queryKey: supplierPaxTypeSchedulesQueryKey(variables.supplierId),
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("supplierPaxConfigurations.failedToCreate", { ns: "admin" })
        )
      );
    },
  });
}
