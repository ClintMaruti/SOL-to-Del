import { useParams } from "react-router-dom";

import { PromotionCreatePage } from "./PromotionCreatePage";
import { PromotionEditPage } from "./PromotionEditPage";

export function PromotionConfigurationPage() {
  const { promotionId } = useParams<{ promotionId?: string }>();

  if (promotionId) {
    return <PromotionEditPage />;
  }

  return <PromotionCreatePage />;
}
