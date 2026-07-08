import {
  api,
  ApiError,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  normalizeSupplierPaxTypeSchedule,
  sortSupplierPaxTypeSchedules,
  type SupplierPaxTypeSchedule,
  type SupplierPaxTypeScheduleDto,
  type UpdateSupplierPaxTypeSchedulePayload,
} from "../model/types";

import { supplierPaxTypeSchedulesQueryKey } from "./queryKeys";

export function useUpdateSupplierPaxTypeSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: UpdateSupplierPaxTypeSchedulePayload): Promise<SupplierPaxTypeSchedule> => {
      const data = await api.put<SupplierPaxTypeScheduleDto>(
        `/catalog/pax-type-schedules/${id}`,
        body
      );
      return normalizeSupplierPaxTypeSchedule(data);
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<SupplierPaxTypeSchedule[]>(
        supplierPaxTypeSchedulesQueryKey(variables.supplierId),
        (previous) =>
          sortSupplierPaxTypeSchedules(
            Array.isArray(previous)
              ? previous.map((schedule) =>
                  schedule.id === updated.id ? updated : schedule
                )
              : [updated]
          )
      );
      toast.success(
        i18n.t("supplierPaxConfigurations.updatedSuccess", { ns: "admin" })
      );
      queryClient.invalidateQueries({
        queryKey: supplierPaxTypeSchedulesQueryKey(variables.supplierId),
      });
    },
    onError: (error, variables) => {
      if (ApiError.isApiError(error) && error.status === 409) {
        toast.error(
          getErrorMessage(
            error,
            i18n.t("supplierPaxConfigurations.versionConflict", {
              ns: "admin",
            })
          )
        );
        queryClient.invalidateQueries({
          queryKey: supplierPaxTypeSchedulesQueryKey(variables.supplierId),
        });
        return;
      }

      toast.error(
        getErrorMessage(
          error,
          i18n.t("supplierPaxConfigurations.failedToUpdate", { ns: "admin" })
        )
      );
    },
  });
}
