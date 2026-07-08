export type {
  SupplierService,
  SupplierServiceOption,
  UpdateSupplierServicePayload,
  ServiceTypeValue,
  CatalogEntityNote,
  UpdateServiceNotePayload,
} from "./types";
export { SERVICE_TYPES, getServiceTypeLabel } from "./types";
export {
  getServiceTypeConfig,
  type ServiceTypeConfig,
} from "./lib/service-type-config";

export { useSupplierService } from "./api/useSupplierService";
export { useSupplierServices } from "./api/useSupplierServices";
export { useUpdateSupplierService } from "./api/useUpdateSupplierService";
export { useToggleSupplierServiceStatus } from "./api/useToggleSupplierServiceStatus";
export {
  useDeleteSupplierService,
  type DeleteSupplierServiceParams,
} from "./api/useDeleteSupplierService";
export { useServiceNote } from "./api/useServiceNote";
export {
  useServiceSearch,
  type ServiceSearchResult,
} from "./api/useServiceSearch";
export { useUpdateServiceNote } from "./api/useUpdateServiceNote";
