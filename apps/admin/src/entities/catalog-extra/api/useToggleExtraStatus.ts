import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { buildCatalogExtraTogglePutBody } from "../lib/catalog-extra-toggle-put-body";
import {
  mergeUpdateExtraIntoDetail,
  normalizeCatalogExtraDetail,
} from "../lib/normalize-catalog-extra-detail";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { CatalogExtra, CatalogExtraDetail } from "../model/types";

export interface ToggleExtraStatusParams {
  extraId: string;
  /** When set (supplier extras tab), supplier-scoped list cache is updated. */
  supplierId?: string;
  serviceId?: string;
  activate: boolean;
}

export function useToggleExtraStatus() {
  const queryClient = useQueryClient();
  const { setExtrasStatus } = useLoadingStates(
    useShallow((state) => ({ setExtrasStatus: state.setExtrasStatus }))
  );

  return useMutation({
    mutationFn: async ({ extraId, activate }: ToggleExtraStatusParams) => {
      setExtrasStatus(extraId, true);
      const rawDetail = await api.get<unknown>(`/catalog/extras/${extraId}`);
      const detail = normalizeCatalogExtraDetail(rawDetail);
      const body = buildCatalogExtraTogglePutBody({ detail, activate });
      const rawPut = await api.put<unknown>(`/catalog/extras/${extraId}`, body);
      return mergeUpdateExtraIntoDetail(rawPut, detail);
    },
    onSuccess: (data, { extraId, supplierId, serviceId }) => {
      setExtrasStatus(extraId, false);
      const patchRow = (row: CatalogExtra) =>
        row.id === extraId ? { ...row, isActive: data.isActive } : row;

      if (supplierId) {
        queryClient.setQueryData<CatalogExtra[]>(
          ["catalog-extras", "supplier", supplierId],
          (previous) => {
            if (!previous) return previous;
            return previous.map(patchRow);
          }
        );
      }
      if (serviceId) {
        queryClient.setQueryData<CatalogExtra[]>(
          ["catalog-extras", "service", serviceId],
          (previous) => {
            if (!previous) return previous;
            return previous.map(patchRow);
          }
        );
      }
      queryClient.setQueryData<CatalogExtraDetail>(
        ["catalog-extra", extraId],
        data
      );
    },
    onError: (error, { extraId }) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateExtraStatus", { ns: "admin" })
        )
      );
      setExtrasStatus(extraId, false);
    },
  });
}
