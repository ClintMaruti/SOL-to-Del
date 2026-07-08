import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

import { Spinner } from "./spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline-secondary"
  | "danger"
  | "ghost"
  | "link"
  | "default"
  | "outline"
  | "destructive";

export type ButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "icon-sm"
  | "icon-md"
  | "icon-lg"
  | "default"
  | "icon";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[var(--button-gap)] whitespace-nowrap rounded-[var(--button-radius)] border border-transparent box-border font-medium tracking-[var(--button-letter-spacing)] cursor-pointer transition-[background-color,color,border-color,border-width,opacity] disabled:pointer-events-none disabled:cursor-not-allowed data-[disabled=true]:opacity-[var(--button-disabled-opacity)] data-[loading=true]:opacity-[var(--button-loading-opacity)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)] hover:bg-[color:var(--button-primary-bg-hover)] data-[disabled=true]:bg-[color:var(--button-disabled-bg)] data-[disabled=true]:text-[color:var(--button-disabled-fg)] data-[disabled=true]:font-semibold focus-visible:border-[3px] focus-visible:border-[color:var(--button-focus-border)]",
        secondary:
          "bg-[color:var(--button-secondary-bg)] text-[color:var(--button-secondary-fg)] font-semibold hover:bg-[color:var(--button-secondary-bg-hover)] focus-visible:border-[4px] focus-visible:border-[color:var(--button-focus-border)]",
        tertiary:
          "border-[color:var(--button-tertiary-border)] bg-transparent text-[color:var(--button-tertiary-fg)] hover:bg-[color:var(--button-tertiary-bg-hover)] hover:text-[color:var(--button-tertiary-fg-hover)] focus-visible:border-[3px] focus-visible:border-[color:var(--button-focus-border)]",
        "outline-secondary":
          "border-[color:var(--button-outline-secondary-border)] bg-transparent text-[color:var(--button-outline-secondary-fg)] hover:bg-[color:var(--button-outline-secondary-bg-hover)] hover:text-[color:var(--button-outline-secondary-fg)] focus-visible:border-[3px] focus-visible:border-[color:var(--button-focus-border)]",
        danger:
          "bg-[color:var(--button-danger-bg)] text-[color:var(--button-danger-fg)] hover:bg-[color:var(--button-danger-bg-hover)] focus-visible:border-[4px] focus-visible:border-[color:var(--button-danger-focus-border)]",
        ghost:
          "bg-transparent text-[color:var(--button-ghost-fg)] hover:border-[color:var(--button-ghost-border-hover)] hover:bg-[color:var(--button-ghost-bg-hover)] hover:text-[color:var(--button-ghost-fg-hover)] focus-visible:border-[3px] focus-visible:border-[color:var(--button-focus-border)]",
        link: "h-auto border-transparent bg-transparent px-0 py-0 text-[color:var(--button-link-fg)] hover:underline focus-visible:border-transparent focus-visible:underline underline-offset-4",
        default:
          "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)] hover:bg-[color:var(--button-primary-bg-hover)] data-[disabled=true]:bg-[color:var(--button-disabled-bg)] data-[disabled=true]:text-[color:var(--button-disabled-fg)] data-[disabled=true]:font-semibold focus-visible:border-[3px] focus-visible:border-[color:var(--button-focus-border)]",
        destructive:
          "bg-[color:var(--button-danger-bg)] text-[color:var(--button-danger-fg)] hover:bg-[color:var(--button-danger-bg-hover)] focus-visible:border-[4px] focus-visible:border-[color:var(--button-danger-focus-border)]",
        outline:
          "border-[color:var(--button-tertiary-border)] bg-transparent text-[color:var(--button-tertiary-fg)] hover:bg-[color:var(--button-tertiary-bg-hover)] hover:text-[color:var(--button-tertiary-fg-hover)] focus-visible:border-[3px] focus-visible:border-[color:var(--button-focus-border)]",
      },
      size: {
        sm: "h-[var(--button-height-sm)] px-[var(--button-padding-x-sm)] text-[length:var(--button-font-size-sm)] leading-[var(--button-line-height-sm)]",
        md: "h-[var(--button-height-md)] px-[var(--button-padding-x-md)] text-[length:var(--button-font-size-md)] leading-[var(--button-line-height-md)]",
        lg: "h-[var(--button-height-lg)] px-[var(--button-padding-x-lg)] text-[length:var(--button-font-size-lg)] leading-[var(--button-line-height-lg)]",
        "icon-sm":
          "size-[var(--button-icon-size-sm)] p-[var(--button-icon-padding-sm)]",
        "icon-md":
          "size-[var(--button-icon-size-md)] p-[var(--button-icon-padding-md)]",
        "icon-lg":
          "size-[var(--button-icon-size-lg)] p-[var(--button-icon-padding-lg)]",
        default:
          "h-[var(--button-height-md)] px-[var(--button-padding-x-md)] text-[length:var(--button-font-size-md)] leading-[var(--button-line-height-md)]",
        icon: "size-[var(--button-icon-size-md)] p-[var(--button-icon-padding-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    /**
     * Shows the Figma loading state inline: spinner plus visible label.
     * Child icons are hidden while loading. Disables the button and sets `aria-busy`.
     * Not applied when `asChild` is true.
     */
    isLoading?: boolean;
  }
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      fullWidth = false,
      isLoading = false,
      children,
      disabled,
      "aria-busy": ariaBusy,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const variantsResult = buttonVariants({ variant, size });
    const showLoadingState = isLoading && !asChild;
    const showDisabledState = Boolean(disabled) && !showLoadingState;
    const finalClassName = cn(variantsResult, fullWidth && "w-full", className);

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-disabled={showDisabledState ? "true" : undefined}
        data-loading={showLoadingState ? "true" : undefined}
        className={finalClassName}
        disabled={disabled || showLoadingState}
        aria-busy={showLoadingState ? true : ariaBusy}
        {...props}
      >
        {showLoadingState ? (
          <>
            <Spinner
              className="size-4 shrink-0"
              aria-hidden="true"
              aria-label={undefined}
              role={undefined}
              focusable="false"
            />
            <span className="inline-flex items-center justify-center gap-[var(--button-gap)] [&_svg]:hidden">
              {children}
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
