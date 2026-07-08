import { Button } from "@sol/ui";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

export type SaveButtonProps = Omit<
  ComponentProps<typeof Button>,
  "variant" | "children"
> & {
  isSavedState: boolean;
};

export function SaveButton({
  isSavedState,
  className,
  type = "button",
  ...rest
}: SaveButtonProps) {
  const { t } = useTranslation("admin");

  return (
    <Button
      type={type}
      variant={isSavedState ? "secondary" : "primary"}
      className={className}
      {...rest}
    >
      {isSavedState ? t("buttons.saved") : t("buttons.save")}
    </Button>
  );
}
