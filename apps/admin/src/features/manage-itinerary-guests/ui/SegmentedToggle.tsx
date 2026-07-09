import { ToggleGroup, ToggleGroupItem, cn } from "@sol/ui";

interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  className?: string;
  disabled?: boolean;
}

export function SegmentedToggle<T extends string>({
  value,
  onValueChange,
  options,
  className,
  disabled,
}: SegmentedToggleProps<T>) {
  return (
    <ToggleGroup
      type="single"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      disabled={disabled}
      className={cn("flex w-full", className)}
    >
      {options.map((option, index) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "h-9 min-w-[48px] flex-1 rounded-none border border-border-tertiary bg-white px-2 text-sm font-medium leading-6 text-text-primary shadow-none",
            "data-[state=on]:border-transparent data-[state=on]:bg-brand-red data-[state=on]:text-white",
            index === 0 && "rounded-l-[6px]",
            index === options.length - 1 && "rounded-r-[6px]",
            index > 0 && "border-l-0"
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
