import { Button } from "@sol/ui";
import { useTranslation } from "react-i18next";

interface OptionsTabHeaderProps {
  onCreateOption: () => void;
  disabled?: boolean;
}

export function OptionsTabHeader({
  onCreateOption,
  disabled,
}: OptionsTabHeaderProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold leading-6 text-neutral-900">
          {t("sections.options")}
        </h2>
        <p className="text-sm font-medium text-neutral-600">
          {t("sections.optionsDescription")}
        </p>
      </div>
      <Button variant="outline" onClick={onCreateOption} disabled={disabled}>
        {t("buttons.createOption")}
      </Button>
    </div>
  );
}
