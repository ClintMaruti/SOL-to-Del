import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { SupplierContract } from "@/entities/supplier-contract/model/types";

export interface CreateSupplierContractPayload {
  supplierId: string;
  name: string;
  link?: string;
  agencyGroupId?: string | null;
  validFrom: string;
  validTo: string;
}

export function useCreateSupplierContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      name,
      link,
      agencyGroupId,
      validFrom,
      validTo,
    }: CreateSupplierContractPayload) => {
      const data = await api.post<SupplierContract>(
        `/catalog/suppliers/${supplierId}/contracts`,
        { name, link, agencyGroupId: agencyGroupId ?? null, validFrom, validTo }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(i18n.t("modals.contractCreatedSuccess", { ns: "admin" }));
      queryClient.invalidateQueries({
        queryKey: ["supplier-contracts", variables.supplierId],
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(
        error,
        i18n.t("errors.failedToCreateContract", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
