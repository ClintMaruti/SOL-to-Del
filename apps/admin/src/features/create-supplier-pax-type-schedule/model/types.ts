import {
  PAX_TYPE_ORDER,
  type PaxType,
} from "@/entities/supplier-pax-type-schedule";

export interface SupplierPaxTypeFormRow {
  paxType: PaxType;
  name: PaxType;
  ageFrom: string;
  ageTo: string;
  isActive: boolean;
}

export interface AddPaxConfigurationFormValues {
  validFrom: string;
  validTo: string;
  paxTypes: SupplierPaxTypeFormRow[];
}

export const DEFAULT_SUPPLIER_PAX_TYPE_ROWS: SupplierPaxTypeFormRow[] =
  PAX_TYPE_ORDER.map((paxType) => ({
    paxType,
    name: paxType,
    ageFrom: "",
    ageTo: "",
    isActive: paxType === "Adult",
  }));

export const DEFAULT_ADD_PAX_CONFIGURATION_VALUES: AddPaxConfigurationFormValues =
  {
    validFrom: "",
    validTo: "",
    paxTypes: DEFAULT_SUPPLIER_PAX_TYPE_ROWS,
  };

export function createDefaultAddPaxConfigurationValues(): AddPaxConfigurationFormValues {
  return {
    validFrom: "",
    validTo: "",
    paxTypes: DEFAULT_SUPPLIER_PAX_TYPE_ROWS.map((row) => ({ ...row })),
  };
}
