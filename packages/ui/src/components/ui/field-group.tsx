import * as React from "react";

import { cn } from "../../lib/utils";

import { Label } from "./label";

export interface FieldGroupProps extends React.ComponentProps<"div"> {
  htmlFor?: string;
  /**
   * When set, the visible label uses this id and `htmlFor` is omitted so the control can
   * use `aria-labelledby` (e.g. ToggleGroup). Mutually exclusive with using `htmlFor` for the same label.
   */
  labelElementId?: string;
  label?: React.ReactNode;
  topRightLabel?: React.ReactNode;
  bottomLeftLabel?: React.ReactNode;
  bottomRightLabel?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  labelClassName?: string;
  topRightLabelClassName?: string;
  bottomLeftLabelClassName?: string;
  bottomRightLabelClassName?: string;
}

function FieldGroup({
  className,
  htmlFor,
  labelElementId,
  label,
  topRightLabel,
  bottomLeftLabel,
  bottomRightLabel,
  error,
  required = false,
  disabled = false,
  labelClassName,
  topRightLabelClassName,
  bottomLeftLabelClassName,
  bottomRightLabelClassName,
  children,
  ...props
}: FieldGroupProps) {
  const showTop = Boolean(label || topRightLabel);
  const showBottom = Boolean(error || bottomLeftLabel || bottomRightLabel);

  return (
    <div
      data-slot="field-group"
      className={cn(
        "flex w-full flex-col gap-0",
        disabled && "opacity-50",
        className
      )}
      {...props}
    >
      {showTop ? (
        <div className="flex w-full items-center justify-between px-0 py-[var(--field-group-top-padding-y)]">
          {label ? (
            <Label
              id={labelElementId}
              htmlFor={labelElementId ? undefined : htmlFor}
              className={cn(
                "inline-flex w-fit max-w-full items-center text-[length:var(--field-group-label-font-size)] leading-[var(--field-group-label-line-height)] font-semibold text-[color:var(--field-group-label-fg)]",
                labelClassName
              )}
            >
              {label}
              {required ? (
                <span className="text-[color:var(--field-group-error-fg)]">
                  *
                </span>
              ) : null}
            </Label>
          ) : (
            <div className="flex-1" />
          )}
          {topRightLabel ? (
            <p
              className={cn(
                "flex-1 text-right text-[length:var(--field-group-meta-font-size)] leading-[var(--field-group-meta-line-height)] font-medium text-[color:var(--field-group-meta-fg)] opacity-80",
                topRightLabelClassName
              )}
            >
              {topRightLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}

      {showBottom ? (
        <div className="flex w-full items-center justify-between px-0 py-[var(--field-group-bottom-padding-y)]">
          {error ? (
            <p
              role="alert"
              className="flex-1 text-[length:var(--field-group-meta-font-size)] leading-[var(--field-group-meta-line-height)] font-medium text-[color:var(--field-group-error-fg)]"
            >
              {error}
            </p>
          ) : (
            <>
              {bottomLeftLabel ? (
                <p
                  className={cn(
                    "flex-1 text-[length:var(--field-group-meta-font-size)] leading-[var(--field-group-meta-line-height)] font-medium text-[color:var(--field-group-helper-fg)] opacity-80",
                    bottomLeftLabelClassName
                  )}
                >
                  {bottomLeftLabel}
                </p>
              ) : (
                <div className="flex-1" />
              )}
              {bottomRightLabel ? (
                <p
                  className={cn(
                    "flex-1 text-right text-[length:var(--field-group-meta-font-size)] leading-[var(--field-group-meta-line-height)] font-medium text-[color:var(--field-group-helper-fg)] opacity-80",
                    bottomRightLabelClassName
                  )}
                >
                  {bottomRightLabel}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { FieldGroup };
