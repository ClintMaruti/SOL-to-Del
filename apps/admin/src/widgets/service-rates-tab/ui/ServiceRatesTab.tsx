import { useSearchParams } from "react-router-dom";

import { useSupplierContracts } from "@/entities/supplier-contract";

import { ServiceRatesContractedSection } from "./ServiceRatesContractedSection";
import { ServiceRatesIdentitySection } from "./ServiceRatesIdentitySection";

interface ServiceRatesTabProps {
  serviceId: string;
  supplierId: string;
}

export function ServiceRatesTab({
  serviceId,
  supplierId,
}: ServiceRatesTabProps) {
  const [searchParams] = useSearchParams();
  const expandRateId = searchParams.get("rateId");
  const { data: contracts = [] } = useSupplierContracts(supplierId);

  return (
    <div className="flex flex-col gap-10 pt-4">
      <ServiceRatesIdentitySection
        serviceId={serviceId}
        expandRateId={expandRateId}
      />
      <ServiceRatesContractedSection
        serviceId={serviceId}
        contracts={contracts}
      />
    </div>
  );
}
