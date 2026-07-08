import type {
  ChargeTypeApi,
  ServiceRateApiItem,
  TimeUnitApi,
} from "./api-types";

/** Domain shape after mapping GET DTOs; `rateName` → `name`. */
export type ServiceRate = Omit<ServiceRateApiItem, "rateName"> & {
  name: string;
};

export type { ChargeTypeApi, TimeUnitApi };
