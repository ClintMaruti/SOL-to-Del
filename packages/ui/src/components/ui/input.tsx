import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

export type InputSize = "xs" | "sm" | "md" | "lg";

export interface InputProps extends Omit<
  React.ComponentProps<"input">,
  "size"
> {
  readonly?: boolean;
  size?: InputSize;
  /** Keeps corners square in both default and focus states (useful in table/grid cells). */
  squareFocus?: boolean;
}

const inputVariants = cva(
  "file:text-[color:var(--input-fg-filled)] file:font-medium file:inline-flex file:border-0 file:bg-transparent file:text-[length:var(--input-font-size)] placeholder:text-[color:var(--input-fg-placeholder)] placeholder:font-medium box-border w-full min-w-0 rounded-[var(--input-radius)] border border-[color:var(--input-border-default)] bg-[color:var(--input-bg-empty)] px-[var(--input-padding-x)] text-[length:var(--input-font-size)] font-medium leading-[var(--input-line-height)] tracking-[var(--input-letter-spacing)] text-[color:var(--input-fg-filled)] shadow-none outline-none transition-[background-color,color,border-color,border-radius,opacity] focus-visible:rounded-[var(--input-focus-radius)] focus-visible:border-[3px] focus-visible:border-[color:var(--input-border-focus)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-[var(--input-disabled-opacity)] disabled:border-[color:var(--input-border-default)] data-[filled=true]:bg-[color:var(--input-bg-filled)] data-[readonly=true]:bg-[color:var(--input-bg-readonly)] data-[readonly=true]:text-[color:var(--input-fg-readonly)] data-[readonly=true]:pointer-events-none data-[readonly=true]:cursor-default aria-invalid:bg-[color:var(--input-bg-error)] aria-invalid:data-[filled=true]:bg-[color:var(--input-bg-error)] aria-invalid:border-[color:var(--input-border-error)] aria-invalid:focus-visible:border-[color:var(--input-border-error)]",
  {
    variants: {
      size: {
        xs: "h-[var(--input-height-xs)]",
        sm: "h-[var(--input-height-sm)]",
        md: "h-[var(--input-height-md)]",
        lg: "h-[var(--input-height-lg)]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

function hasMeaningfulValue(value: React.ComponentProps<"input">["value"]) {
  if (typeof value === "number") {
    return !Number.isNaN(value);
  }

  if (typeof value === "string") {
    return value.length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value);
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = "md",
      readonly,
      squareFocus = false,
      readOnly,
      disabled,
      onChange,
      tabIndex,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const isReadonly = readonly || readOnly;
    const [hasValue, setHasValue] = React.useState(() =>
      hasMeaningfulValue(value ?? defaultValue)
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setHasValue(hasMeaningfulValue(value));
      }
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    };

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        data-size={size}
        data-filled={hasValue ? "true" : "false"}
        data-readonly={isReadonly ? "true" : undefined}
        readOnly={isReadonly}
        disabled={disabled}
        tabIndex={isReadonly ? -1 : tabIndex}
        className={cn(
          inputVariants({ size }),
          squareFocus &&
            "[--input-radius:0px] [--input-focus-radius:0px] focus-visible:rounded-none!",
          className
        )}
        value={value}
        defaultValue={defaultValue}
        {...props}
        onChange={handleChange}
      />
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
