import * as React from "react";

import { cn } from "../../lib/utils";

import { Input, type InputProps } from "./input";

export interface RangeInputGroupProps extends Omit<
  React.ComponentProps<"div">,
  "onChange"
> {
  minLabel: React.ReactNode;
  maxLabel: React.ReactNode;
  minInputProps: Omit<InputProps, "className" | "size">;
  maxInputProps: Omit<InputProps, "className" | "size">;
  invalid?: boolean;
  valueWidthClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

function RangeInputGroup({
  className,
  minLabel,
  maxLabel,
  minInputProps,
  maxInputProps,
  invalid = false,
  valueWidthClassName,
  labelClassName,
  inputClassName,
  ...props
}: RangeInputGroupProps) {
  const borderClass = invalid
    ? "border-[color:var(--range-input-border-error)]"
    : "border-[color:var(--range-input-border-default)]";
  const focusClass = invalid
    ? "focus-within:border-[color:var(--range-input-border-error)]"
    : "focus-within:border-[color:var(--range-input-border-focus)]";

  return (
    <div
      data-slot="range-input-group"
      role="group"
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-[var(--range-input-radius)] border transition-[border-color]",
        borderClass,
        focusClass,
        className
      )}
      {...props}
    >
      <div className={cn("flex h-[var(--range-input-height)] items-stretch")}>
        <div
          className={cn(
            "flex items-center bg-[color:var(--range-input-label-bg)] px-[var(--range-input-label-padding-x)] text-[length:var(--range-input-font-size)] leading-[var(--range-input-line-height)] font-medium tracking-[var(--range-input-letter-spacing)] text-[color:var(--range-input-label-fg)]",
            labelClassName
          )}
        >
          {minLabel}
        </div>
        <div
          className={cn(
            "flex h-full items-center bg-[color:var(--range-input-field-bg)]",
            invalid && "bg-[color:var(--range-input-field-bg-error)]",
            valueWidthClassName ?? "w-[var(--range-input-value-width)]"
          )}
        >
          <Input
            {...minInputProps}
            size="md"
            aria-invalid={invalid ? "true" : minInputProps["aria-invalid"]}
            className={cn(
              "h-full rounded-none border-0 bg-transparent px-[var(--range-input-input-padding-x)] text-center shadow-none focus-visible:rounded-none focus-visible:border-0 focus-visible:ring-0 data-[filled=true]:bg-transparent aria-invalid:bg-transparent aria-invalid:data-[filled=true]:bg-transparent",
              inputClassName
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex h-[var(--range-input-height)] items-stretch border-l",
          borderClass
        )}
      >
        <div
          className={cn(
            "flex items-center bg-[color:var(--range-input-label-bg)] px-[var(--range-input-label-padding-x)] text-[length:var(--range-input-font-size)] leading-[var(--range-input-line-height)] font-medium tracking-[var(--range-input-letter-spacing)] text-[color:var(--range-input-label-fg)]",
            labelClassName
          )}
        >
          {maxLabel}
        </div>
        <div
          className={cn(
            "flex h-full items-center bg-[color:var(--range-input-field-bg)]",
            invalid && "bg-[color:var(--range-input-field-bg-error)]",
            valueWidthClassName ?? "w-[var(--range-input-value-width)]"
          )}
        >
          <Input
            {...maxInputProps}
            size="md"
            aria-invalid={invalid ? "true" : maxInputProps["aria-invalid"]}
            className={cn(
              "h-full rounded-none border-0 bg-transparent px-[var(--range-input-input-padding-x)] text-center shadow-none focus-visible:rounded-none focus-visible:border-0 focus-visible:ring-0 data-[filled=true]:bg-transparent aria-invalid:bg-transparent aria-invalid:data-[filled=true]:bg-transparent",
              inputClassName
            )}
          />
        </div>
      </div>
    </div>
  );
}

export { RangeInputGroup };
