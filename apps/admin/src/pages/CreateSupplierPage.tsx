import { useCreateNewSupplierPage } from "@/features/create-supplier";
import { SupplierForm } from "@/widgets/supplier-form";

export function CreateSupplierPage() {
  const props = useCreateNewSupplierPage();
  return <SupplierForm mode="create" {...props} />;
}
