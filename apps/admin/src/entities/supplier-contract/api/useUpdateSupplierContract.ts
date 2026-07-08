import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { SupplierContract } from "../model/types";

export interface UpdateSupplierContractPayload {
  supplierId: string;
  contractId: string;
  name?: string;
  link?: string;
  validFrom?: string;
  validTo?: string;
  version?: number;
}

export function useUpdateSupplierContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      name,
      link,
      validFrom,
      validTo,
      version,
    }: UpdateSupplierContractPayload) => {
      const data = await api.put<SupplierContract>(
        `/catalog/contracts/${contractId}`,
        { name, link, validFrom, validTo, version }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      // Update detail/list caches synchronously to avoid stale-value flash
      // right after save while invalidate-driven refetch is in flight.
      if (data) {
        queryClient.setQueryData<SupplierContract>(
          ["supplier-contracts", variables.supplierId, variables.contractId],
          data
        );
        queryClient.setQueryData<SupplierContract[]>(
          ["supplier-contracts", variables.supplierId],
          (prev) =>
            Array.isArray(prev)
              ? prev.map((contract) =>
                  contract.id === variables.contractId ? data : contract
                )
              : prev
        );
      }

      toast.success(i18n.t("modals.contractUpdatedSuccess", { ns: "admin" }));
      queryClient.invalidateQueries({
        queryKey: ["supplier-contracts", variables.supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "supplier-contracts",
          variables.supplierId,
          variables.contractId,
        ],
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(
        error,
        i18n.t("errors.failedToUpdateContract", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
