import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { SupplierHeadOfficeApiResponse } from "../model/api-types";
import type { SupplierHeadOffice } from "../model/types";

interface ToggleSupplierHeadOfficeStatusParams {
  supplierHeadOfficeId: string;
  isActive: boolean;
}

export function useToggleSupplierHeadOfficeStatus() {
  const queryClient = useQueryClient();
  const { setSupplierHeadOfficesStatus } = useLoadingStates(
    useShallow((state) => ({
      setSupplierHeadOfficesStatus: state.setSupplierHeadOfficesStatus,
    }))
  );

  return useMutation({
    mutationFn: async ({
      supplierHeadOfficeId,
      isActive,
    }: ToggleSupplierHeadOfficeStatusParams) => {
      setSupplierHeadOfficesStatus(supplierHeadOfficeId, true);
      const url = isActive
        ? `/catalog/head-offices/${supplierHeadOfficeId}/deactivate`
        : `/catalog/head-offices/${supplierHeadOfficeId}/activate`;
      const response = await api.patch<SupplierHeadOfficeApiResponse>(url);
      return response;
    },
    onSuccess: (_data, { supplierHeadOfficeId }) => {
      // TODO: test this once the API is implemented
      setSupplierHeadOfficesStatus(supplierHeadOfficeId, false);
      queryClient.setQueryData<SupplierHeadOffice[]>(
        ["supplier-head-offices"],
        (previous) => {
          if (!previous) return previous;
          return previous.map((headOffice) =>
            headOffice.id === supplierHeadOfficeId
              ? { ...headOffice, isActive: !headOffice.isActive }
              : headOffice
          );
        }
      );
      queryClient.setQueryData<SupplierHeadOffice>(
        ["supplier-head-office", supplierHeadOfficeId],
        (previous) => {
          if (!previous) return previous;
          return { ...previous, isActive: !previous.isActive };
        }
      );
    },
    onError: (error, { supplierHeadOfficeId }) => {
      setSupplierHeadOfficesStatus(supplierHeadOfficeId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateSupplierHeadOfficeStatus", {
            ns: "admin",
          })
        )
      );
    },
  });
}
