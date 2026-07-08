import type { CreateSupplierServiceSubmitData } from "./schema";

export type CreateSupplierServicePayload = CreateSupplierServiceSubmitData & {
  supplierId: string;
};
