import { useForm, useStore } from "@tanstack/react-form";

import type { CreateSupplierHeadOfficeFormData } from "./types";

export const INITIAL_FORM_DATA: CreateSupplierHeadOfficeFormData = {
  name: "",
  email: "",
  phoneNumber: "",
  additionalEmail: "",
  website: "",
  country: "",
  city: "",
  postalCode: "",
  streetAddress: "",
};

export function useCreateSupplierHeadOfficeForm(
  initialData?: CreateSupplierHeadOfficeFormData | null
) {
  const form = useForm({
    defaultValues: initialData ?? INITIAL_FORM_DATA,
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const reset = (nextInitial?: CreateSupplierHeadOfficeFormData | null) => {
    form.reset(nextInitial ?? initialData ?? INITIAL_FORM_DATA);
  };

  return {
    form,
    isDirty,
    reset,
  };
}
