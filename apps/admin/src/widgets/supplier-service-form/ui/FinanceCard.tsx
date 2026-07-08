import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { SupplierService } from "@/entities/supplier-services";

interface FinanceCardProps {
  supplierService: SupplierService;
}

export function FinanceCard({ supplierService }: FinanceCardProps) {
  const { t } = useTranslation("admin");

  return (
    <Card id="finance" className="p-6">
      <CardHeader className="p-0 mb-3">
        <div className="">
          <CardTitle className="text-base font-bold leading-6 text-neutral-900">
            {t("sections.finance")}
          </CardTitle>
          <p className="text-sm text-neutral-600 font-medium">
            {t("sections.financeDescription")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        <div className="form-grid-compact max-w-md">
          <div className="space-y-2">
            <Label className="text-neutral-900 text-sm font-semibold m-0 mb-1 leading-6">
              {t("labels.nominalSaleCode")}
            </Label>
            <Input value={supplierService.nominalSaleCode ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-900 text-sm font-semibold m-0 mb-1 leading-6">
              {t("labels.purchaseNominalCode")}
            </Label>
            <Input value={supplierService.purchaseNominalCode ?? ""} readOnly />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
