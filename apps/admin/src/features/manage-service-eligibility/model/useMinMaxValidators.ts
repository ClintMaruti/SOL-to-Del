import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";

interface UseMinMaxValidatorsParams {
  form: AnyFormApi;
  minName: string;
  maxName: string;
}

export function useMinMaxValidators({
  form,
  minName,
  maxName,
}: UseMinMaxValidatorsParams) {
  const { t } = useTranslation("admin");

  const minValidators = useMemo(
    () => ({
      onChange: ({ value }: { value: number | null }) => {
        const maxVal = form.getFieldValue(maxName) as number | null;
        const hasMin = value !== null;
        const hasMax = maxVal !== null;
        if (hasMin && hasMax && value! > maxVal!) {
          return t("errors.invalidMinMax");
        }
        return undefined;
      },
    }),
    [form, maxName, t]
  );

  const maxValidators = useMemo(
    () => ({
      onChange: ({ value }: { value: number | null }) => {
        const minVal = form.getFieldValue(minName) as number | null;
        const hasMax = value !== null;
        const hasMin = minVal !== null;
        if (hasMin && hasMax && value! < minVal!) {
          return t("errors.invalidMinMax");
        }
        return undefined;
      },
    }),
    [form, minName, t]
  );

  return {
    maxValidators,
    minValidators,
  };
}
