import { Button, Input, cn } from "@sol/ui";
import { useTranslation } from "react-i18next";

export interface RelativeRangePickerProps {
  title: string;
  fromLabel: string;
  toLabel: string;
  fromValue: number | null;
  toValue: number | null;
  fromPlaceholder: string;
  toPlaceholder: string;
  onFromChange: (value: number | null) => void;
  onToChange: (value: number | null) => void;
  onConfirm: () => void;
  hasFromError?: boolean;
  hasToError?: boolean;
  className?: string;
}

export function RelativeRangePicker({
  title,
  fromLabel,
  toLabel,
  fromValue,
  toValue,
  fromPlaceholder,
  toPlaceholder,
  onFromChange,
  onToChange,
  onConfirm,
  hasFromError = false,
  hasToError = false,
  className,
}: RelativeRangePickerProps) {
  const { t } = useTranslation("admin");

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[6px] bg-white p-3 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <p className="text-base font-bold leading-6 text-text-primary">
          {title}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex w-[120px] flex-col gap-0">
            <label className="px-0 py-1 text-sm font-semibold leading-6 text-text-primary">
              {fromLabel}
            </label>
            <Input
              type="number"
              inputMode="numeric"
              value={fromValue ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value.trim();
                onFromChange(nextValue ? Number(nextValue) : null);
              }}
              placeholder={fromPlaceholder}
              className={cn(
                "h-9 bg-background-primary px-3 py-1 text-sm font-medium leading-6 text-text-primary shadow-none [appearance:textfield] placeholder:text-text-secondary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                hasFromError && "border-destructive"
              )}
            />
          </div>

          <div className="flex w-[120px] flex-col gap-0">
            <label className="px-0 py-1 text-sm font-semibold leading-6 text-text-primary">
              {toLabel}
            </label>
            <Input
              type="number"
              inputMode="numeric"
              value={toValue ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value.trim();
                onToChange(nextValue ? Number(nextValue) : null);
              }}
              placeholder={toPlaceholder}
              className={cn(
                "h-9 bg-background-primary px-3 py-1 text-sm font-medium leading-6 text-text-primary shadow-none [appearance:textfield] placeholder:text-text-secondary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                hasToError && "border-destructive"
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex items-start">
        <Button type="button" variant="tertiary" size="md" onClick={onConfirm}>
          {t("buttons.confirm")}
        </Button>
      </div>
    </div>
  );
}
