import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { updateToggleStatusListCaches } from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { SupplierDetail, Supplier } from "../model/types";

export interface ToggleSupplierStatusParams {
  supplierId: string;
  activate: boolean;
}

export function useToggleSupplierStatus() {
  const queryClient = useQueryClient();
  const { setSuppliersStatus } = useLoadingStates(
    useShallow((state) => ({ setSuppliersStatus: state.setSuppliersStatus }))
  );

  return useMutation({
    mutationFn: async ({
      supplierId,
      activate,
    }: ToggleSupplierStatusParams): Promise<SupplierDetail | undefined> => {
      setSuppliersStatus(supplierId, true);
      const path = activate
        ? `/catalog/suppliers/${supplierId}/activate`
        : `/catalog/suppliers/${supplierId}/deactivate`;
      return api.patch<SupplierDetail>(path);
    },
    onSuccess: (_data, { supplierId }) => {
      setSuppliersStatus(supplierId, false);

      const toggle = (supplier: Supplier) =>
        supplier.id === supplierId
          ? { ...supplier, isActive: !supplier.isActive }
          : supplier;

      updateToggleStatusListCaches({
        queryClient,
        rootQueryKey: ["suppliers"],
        entityId: supplierId,
        toggle,
      });

      queryClient.setQueryData<SupplierDetail>(
        ["suppliers", supplierId],
        (previous) =>
          previous ? { ...previous, isActive: !previous.isActive } : previous
      );
    },
    onError: (error, { supplierId }) => {
      setSuppliersStatus(supplierId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateSupplierStatus", { ns: "admin" })
        )
      );
    },
  });
}
