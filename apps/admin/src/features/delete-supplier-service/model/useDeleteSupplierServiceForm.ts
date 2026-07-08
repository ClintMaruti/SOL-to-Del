import { useCallback, useState } from "react";

import { useDeleteSupplierService } from "@/entities/supplier-services";
import type { SupplierService } from "@/entities/supplier-services";

interface UseDeleteSupplierServiceFormOptions {
  supplierService: SupplierService | null;
  onSuccess?: () => void;
}

export function useDeleteSupplierServiceForm({
  supplierService,
  onSuccess,
}: UseDeleteSupplierServiceFormOptions) {
  const [error, setError] = useState<Error | null>(null);
  const { mutate: deleteSupplierService, isPending } =
    useDeleteSupplierService();

  const handleDelete = useCallback(() => {
    if (!supplierService) return;

    setError(null);
    deleteSupplierService(
      { serviceId: supplierService.id, supplierId: supplierService.supplierId },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (err) => {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to delete supplier service")
          );
        },
      }
    );
  }, [supplierService, deleteSupplierService, onSuccess]);

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
