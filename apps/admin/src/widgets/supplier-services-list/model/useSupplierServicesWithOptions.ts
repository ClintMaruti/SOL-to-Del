import type {
  SupplierService,
  SupplierServiceOption,
} from "@/entities/supplier-services";

export interface ServiceTableRow {
  service: SupplierService;
  option: SupplierServiceOption | null;
  isFirstOptionRow: boolean;
  optionCount: number;
}

export function buildServiceTableRows(
  services: SupplierService[]
): ServiceTableRow[] {
  const rows: ServiceTableRow[] = [];

  for (const service of services) {
    const options = service.options ?? [];

    if (options.length === 0) {
      rows.push({
        service,
        option: null,
        isFirstOptionRow: true,
        optionCount: 1,
      });
    } else {
      options.forEach((option, index) => {
        rows.push({
          service,
          option,
          isFirstOptionRow: index === 0,
          optionCount: options.length,
        });
      });
    }
  }

  return rows;
}
