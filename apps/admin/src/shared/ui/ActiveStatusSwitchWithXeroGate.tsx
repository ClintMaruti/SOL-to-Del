import { Switch, Tooltip, TooltipContent, TooltipTrigger } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { hasSupplierXeroId } from "@/shared/lib/supplierXeroId";

export type ActiveStatusSwitchWithXeroGateProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /**
   * Xero ID used for activation (supplier: finance Xero; agency: Kenya / KEN Xero ID).
   * `null`/undefined/empty means no ID (API uses `null`).
   */
  xeroId: string | null | undefined;
  ariaLabel: string;
  size?: "default" | "sm";
  loading?: boolean;
  /** Tooltip body copy — supplier vs agency wording. */
  variant?: "supplier" | "agency";
};

/**
 * Active/inactive switch: turning on requires a Xero ID. When inactive without it,
 * the switch is disabled and a tooltip explains why (hover).
 */
export function ActiveStatusSwitchWithXeroGate({
  checked,
  onCheckedChange,
  xeroId,
  ariaLabel,
  size = "default",
  loading,
  variant = "supplier",
}: ActiveStatusSwitchWithXeroGateProps) {
  const { t } = useTranslation("admin");
  const hasXero = hasSupplierXeroId(xeroId);
  const blockTurningOn = !checked && !hasXero;
  const tooltipBodyKey =
    variant === "agency"
      ? "tooltips.xeroIdRequiredToActivateAgencyBody"
      : "tooltips.xeroIdRequiredToActivateSupplierBody";

  const switchNode = (
    <Switch
      checked={checked}
      disabled={blockTurningOn}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      size={size}
      loading={loading}
    />
  );

  if (!blockTurningOn) {
    return switchNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default">{switchNode}</span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-xs text-left text-white [&_p]:text-white"
      >
        <p className="font-semibold leading-snug text-white">
          {t("tooltips.xeroIdRequiredToActivateTitle")}
        </p>
        <p className="mt-1 font-normal leading-snug text-white">
          {t(tooltipBodyKey)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
