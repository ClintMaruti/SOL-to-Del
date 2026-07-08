import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

import { Label } from "./label";

export type CheckboxSize = "sm" | "md" | "lg";

const checkboxVariants = cva(
  "peer group/checkbox shrink-0 rounded-[var(--checkbox-radius)] border box-border bg-[color:var(--checkbox-bg-unchecked)] border-[color:var(--checkbox-border-default)] text-[color:var(--checkbox-icon-fg)] shadow-none outline-none transition-[background-color,border-color,box-shadow,opacity] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[color:var(--checkbox-bg-disabled)] disabled:border-[color:var(--checkbox-border-disabled)] enabled:hover:border-[color:var(--checkbox-border-hover)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--checkbox-focus-ring)] focus-visible:ring-offset-0 focus-visible:border-[color:var(--checkbox-border-focus-inner)] data-[state=checked]:bg-[color:var(--checkbox-bg-checked)] data-[state=checked]:border-[color:var(--checkbox-border-checked)] data-[state=checked]:focus-visible:border-[color:var(--checkbox-border-checked)] data-[state=indeterminate]:bg-[color:var(--checkbox-bg-checked)] data-[state=indeterminate]:border-[color:var(--checkbox-border-checked)] data-[state=indeterminate]:focus-visible:border-[color:var(--checkbox-border-checked)]",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-6",
      },
      invalid: {
        true: "border-[color:var(--checkbox-border-error)] enabled:hover:border-[color:var(--checkbox-border-error)] data-[state=checked]:bg-[color:var(--checkbox-bg-error)] data-[state=checked]:border-[color:var(--checkbox-border-error)] data-[state=checked]:focus-visible:border-[color:var(--checkbox-border-error)] data-[state=indeterminate]:bg-[color:var(--checkbox-bg-error)] data-[state=indeterminate]:border-[color:var(--checkbox-border-error)] data-[state=indeterminate]:focus-visible:border-[color:var(--checkbox-border-error)]",
        false: "",
      },
    },
    defaultVariants: {
      size: "sm",
      invalid: false,
    },
  }
);

const checkboxIndicatorSizes: Record<CheckboxSize, string> = {
  sm: "size-[10px]",
  md: "size-3",
  lg: "size-[14px]",
};

const checkboxGroupOffsets: Record<CheckboxSize, string> = {
  sm: "pt-1",
  md: "pt-[2px]",
  lg: "pt-0",
};

function CheckboxCheckIcon({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M2.5 6.25 4.875 8.625 9.5 3.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckboxMinusIcon({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M2.5 6h7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  size?: CheckboxSize;
  invalid?: boolean;
  iconClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      size = "sm",
      invalid,
      iconClassName,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const isInvalid =
      invalid ?? (ariaInvalid === true || ariaInvalid === "true");

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        data-slot="checkbox"
        data-size={size}
        aria-invalid={isInvalid || ariaInvalid}
        className={cn(
          checkboxVariants({ size, invalid: isInvalid }),
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <CheckboxCheckIcon
            className={cn(
              checkboxIndicatorSizes[size],
              "block group-data-[state=indeterminate]/checkbox:hidden",
              iconClassName
            )}
          />
          <CheckboxMinusIcon
            className={cn(
              checkboxIndicatorSizes[size],
              "hidden group-data-[state=indeterminate]/checkbox:block",
              iconClassName
            )}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export interface CheckboxGroupProps extends Omit<CheckboxProps, "size"> {
  size?: CheckboxSize;
  label?: React.ReactNode;
  description?: React.ReactNode;
  wrapperClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

const CheckboxGroup = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxGroupProps
>(
  (
    {
      id,
      size = "sm",
      label,
      description,
      disabled,
      className,
      wrapperClassName,
      labelClassName,
      descriptionClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <div
        data-slot="checkbox-group"
        className={cn("flex items-start gap-3", wrapperClassName)}
      >
        <div
          className={cn(
            "flex items-center shrink-0",
            checkboxGroupOffsets[size]
          )}
        >
          <Checkbox
            ref={ref}
            id={checkboxId}
            size={size}
            disabled={disabled}
            className={className}
            {...props}
          />
        </div>
        {(label || description) && (
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center gap-0.5",
              disabled && "opacity-50"
            )}
          >
            {label && (
              <Label
                htmlFor={checkboxId}
                className={cn(
                  "cursor-pointer text-sm font-medium leading-6 text-[color:var(--Text-Primary)]",
                  labelClassName
                )}
              >
                {label}
              </Label>
            )}
            {description && (
              <p
                className={cn(
                  "text-sm leading-5 text-[color:var(--Text-Tertiary)]",
                  descriptionClassName
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, CheckboxGroup };
