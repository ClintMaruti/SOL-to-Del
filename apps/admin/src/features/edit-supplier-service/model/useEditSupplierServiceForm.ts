import { useForm, useStore } from "@tanstack/react-form";

export interface EditSupplierServiceFormValues {
  name: string;
  alternativeName: string;
  serviceTypeId: string;
  locationId: string;
  fromLocationId: string;
  toLocationId: string;
  description: string;
  tags: string;
  isActive: boolean;
}

export const INITIAL_FORM_DATA: EditSupplierServiceFormValues = {
  name: "",
  alternativeName: "",
  serviceTypeId: "",
  locationId: "",
  fromLocationId: "",
  toLocationId: "",
  description: "",
  tags: "",
  isActive: true,
};

export function useEditSupplierServiceForm(
  initialData?: EditSupplierServiceFormValues | null
) {
  const form = useForm({
    defaultValues: initialData ?? INITIAL_FORM_DATA,
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const reset = (nextInitial?: EditSupplierServiceFormValues | null) => {
    form.reset(nextInitial ?? initialData ?? INITIAL_FORM_DATA);
  };

  return {
    form,
    isDirty,
    reset,
  };
}
