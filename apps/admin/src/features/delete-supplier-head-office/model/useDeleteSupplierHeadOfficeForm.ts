import { useCallback, useState } from "react";

import { useDeleteSupplierHeadOffice } from "@/entities/supplier-head-office/api/useDeleteSupplierHeadOffice";
import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";

interface UseDeleteSupplierHeadOfficeFormOptions {
  supplierHeadOffice: SupplierHeadOffice | null;
  onSuccess?: () => void;
}

export function useDeleteSupplierHeadOfficeForm({
  supplierHeadOffice,
  onSuccess,
}: UseDeleteSupplierHeadOfficeFormOptions) {
  const [error, setError] = useState<Error | null>(null);
  const { mutate: deleteSupplierHeadOffice, isPending } =
    useDeleteSupplierHeadOffice();

  const handleDelete = useCallback(() => {
    if (!supplierHeadOffice) return;

    setError(null);
    deleteSupplierHeadOffice(supplierHeadOffice.id, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err) => {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to delete supplier head office")
        );
      },
    });
  }, [supplierHeadOffice, deleteSupplierHeadOffice, onSuccess]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleDelete,
    isPending,
    error,
    resetError,
  };
}
