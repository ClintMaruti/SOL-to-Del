import { useParams } from "react-router-dom";

import { useSupplier } from "@/entities/suppliers";

export function useSupplierData() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const { data: supplier, isLoading, error } = useSupplier(supplierId);

  const displayName = supplier?.name ?? "Supplier";

  return {
    supplierId,
    supplier,
    isLoading,
    error,
    title: displayName,
    description:
      "Complete and manage all information related to this supplier, including services, extras, discounts, and rate settings.",
  };
}
