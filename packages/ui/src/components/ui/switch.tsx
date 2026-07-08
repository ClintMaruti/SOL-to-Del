import { cva } from "class-variance-authority";
import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../../lib/utils";

import { Spinner } from "./spinner";

export type SwitchSize = "sm" | "md" | "lg" | "default";
export type SwitchVariant = "solid" | "outline";

const switchVariants = cva(
  "peer group/switch relative inline-flex shrink-0 items-center rounded-full outline-none transition-[background-color,border-color,box-shadow,opacity] disabled:cursor-not-allowed disabled:opacity-[var(--switch-disabled-opacity)] data-[loading=true]:cursor-wait",
  {
    variants: {
      size: {
        sm: "h-[var(--switch-height-sm)] w-[var(--switch-width-sm)]",
        md: "h-[var(--switch-height-md)] w-[var(--switch-width-md)]",
        lg: "h-[var(--switch-height-lg)] w-[var(--switch-width-lg)]",
        default: "h-[var(--switch-height-sm)] w-[var(--switch-width-sm)]",
      },
      variant: {
        solid:
          "bg-[color:var(--switch-solid-unchecked-bg)] shadow-[var(--switch-shadow-xs)] data-[state=checked]:bg-[color:var(--switch-solid-checked-bg)] focus-visible:shadow-[var(--switch-solid-focus-shadow)]",
        outline:
          "border bg-[color:var(--switch-outline-unchecked-bg)] border-[color:var(--switch-outline-unchecked-border)] data-[state=checked]:bg-[color:var(--switch-outline-checked-bg)] data-[state=checked]:border-[color:var(--switch-outline-checked-border)] focus-visible:shadow-[0_0_0_3px_var(--switch-focus-ring)]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "solid",
    },
  }
);

const switchThumbVariants = cva(
  "pointer-events-none absolute top-1/2 left-[length:var(--switch-thumb-inset)] block translate-x-0 -translate-y-1/2 rounded-full transition-[transform,background-color]",
  {
    variants: {
      size: {
        sm: "size-[var(--switch-thumb-size-sm)] data-[state=checked]:translate-x-[length:var(--switch-thumb-travel-sm)]",
        md: "size-[var(--switch-thumb-size-md)] data-[state=checked]:translate-x-[length:var(--switch-thumb-travel-md)]",
        lg: "size-[var(--switch-thumb-size-lg)] data-[state=checked]:translate-x-[length:var(--switch-thumb-travel-lg)]",
        default:
          "size-[var(--switch-thumb-size-sm)] data-[state=checked]:translate-x-[length:var(--switch-thumb-travel-sm)]",
      },
      variant: {
        solid:
          "bg-[color:var(--switch-solid-thumb-bg)] shadow-[var(--switch-shadow-xs)]",
        outline:
          "bg-[color:var(--switch-outline-unchecked-thumb-bg)] shadow-[var(--switch-shadow-xs)] group-data-[state=checked]/switch:bg-[color:var(--switch-outline-checked-thumb-bg)]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "solid",
    },
  }
);

export interface SwitchProps extends React.ComponentProps<
  typeof SwitchPrimitive.Root
> {
  size?: SwitchSize;
  variant?: SwitchVariant;
  loading?: boolean;
}

function normalizeSwitchSize(size: SwitchSize): Exclude<SwitchSize, "default"> {
  return size === "default" ? "sm" : size;
}

function Switch({
  className,
  size = "default",
  variant = "solid",
  loading = false,
  disabled,
  ...props
}: SwitchProps) {
  const normalizedSize = normalizeSwitchSize(size);

  return (
    <div className="relative inline-flex items-center">
      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-4" />
        </div>
      ) : null}
      <SwitchPrimitive.Root
        data-slot="switch"
        data-size={normalizedSize}
        data-variant={variant}
        data-loading={loading ? "true" : undefined}
        disabled={disabled || loading}
        className={cn(switchVariants({ size, variant }), className)}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(switchThumbVariants({ size, variant }))}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}

export { Switch };
