import type { Supplier } from "@/entities/suppliers";
import type { AnyFormApi } from "@/shared/ui";

import { PromotionBasicsCard } from "./PromotionBasicsCard";
import { PromotionRulesCard } from "./PromotionRulesCard";

interface PromotionConfigurationFormProps {
  form: AnyFormApi;
  suppliers: Supplier[];
}

export function PromotionConfigurationForm({
  form,
  suppliers,
}: PromotionConfigurationFormProps) {
  return (
    <div className="space-y-2">
      <PromotionBasicsCard form={form} />
      <PromotionRulesCard form={form} suppliers={suppliers} />
    </div>
  );
}
