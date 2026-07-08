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

import {
  normalizeSupplierCloseout,
  type SupplierCloseout,
  type SupplierCloseoutDto,
} from "../model/types";

import { supplierCloseoutsRootQueryKey } from "./queryKeys";

export interface ToggleSupplierCloseoutStatusParams {
  supplierId: string;
  closeoutId: string;
  isActive: boolean;
}

export function useToggleSupplierCloseoutStatus() {
  const queryClient = useQueryClient();
  const { setCloseoutsStatus } = useLoadingStates(
    useShallow((state) => ({
      setCloseoutsStatus: state.setCloseoutsStatus,
    }))
  );

  return useMutation({
    mutationFn: async ({
      closeoutId,
      isActive,
    }: ToggleSupplierCloseoutStatusParams) => {
      setCloseoutsStatus(closeoutId, true);
      const action = isActive ? "deactivate" : "activate";
      const data = await api.patch<SupplierCloseoutDto>(
        `/catalog/closeouts/${closeoutId}/${action}`
      );
      return normalizeSupplierCloseout(data);
    },
    onSuccess: (updatedCloseout, { closeoutId }) => {
      setCloseoutsStatus(closeoutId, false);

      const toggle = (row: SupplierCloseout) =>
        row.id === closeoutId
          ? {
              ...row,
              status: updatedCloseout.status,
              isActive: updatedCloseout.isActive,
              version: updatedCloseout.version ?? row.version,
            }
          : row;

      updateToggleStatusListCaches({
        queryClient,
        rootQueryKey: supplierCloseoutsRootQueryKey,
        entityId: closeoutId,
        toggle,
      });
    },
    onError: (error, { closeoutId }) => {
      setCloseoutsStatus(closeoutId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateCloseoutStatus", { ns: "admin" })
        )
      );
    },
  });
}
