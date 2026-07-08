import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

export function FilledCaretDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
    >
      <path d="M8.00002 10.3832C7.78995 10.3832 7.59295 10.292 7.45614 10.1216L4.56216 6.52367C4.39181 6.31361 4.36292 6.02195 4.48783 5.78299C4.61273 5.54404 4.85573 5.39166 5.12482 5.39166H10.8752C11.1443 5.39166 11.3873 5.54404 11.5122 5.78299C11.6371 6.02195 11.6082 6.31361 11.4379 6.52367L8.5439 10.1216C8.40709 10.292 8.21008 10.3832 8.00002 10.3832Z" />
    </svg>
  );
}

export type SelectSize = "xs" | "sm" | "md" | "lg" | "default";

interface SelectFieldState {
  invalid?: boolean | "true";
}

const SelectFieldStateContext = React.createContext<SelectFieldState>({});

const selectTriggerVariants = cva(
  "group/select box-border flex w-fit min-w-0 items-center justify-between gap-[var(--select-gap)] rounded-[var(--select-radius)] border border-[color:var(--select-border-default)] bg-[color:var(--select-bg-empty)] px-[var(--select-padding-x)] text-[length:var(--select-font-size)] font-medium leading-[var(--select-line-height)] tracking-[var(--select-letter-spacing)] text-[color:var(--select-fg-filled)] shadow-none outline-none transition-[background-color,color,border-color,border-radius,opacity] focus-visible:rounded-[var(--select-focus-radius)] focus-visible:border-[3px] focus-visible:border-[color:var(--select-border-focus)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-[var(--select-disabled-opacity)] disabled:border-[color:var(--select-border-default)] data-[placeholder]:text-[color:var(--select-fg-placeholder)] data-[filled=true]:bg-[color:var(--select-bg-filled)] data-[filled=true]:text-[color:var(--select-fg-filled)] not-data-[placeholder]:bg-[color:var(--select-bg-filled)] aria-invalid:bg-[color:var(--select-bg-error)] aria-invalid:data-[filled=true]:bg-[color:var(--select-bg-error)] aria-invalid:not-data-[placeholder]:bg-[color:var(--select-bg-error)] aria-invalid:border-[color:var(--select-border-error)] aria-invalid:focus-visible:border-[color:var(--select-border-error)] *:data-[slot=select-value]:truncate *:data-[slot=select-value]:min-w-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[color:var(--select-icon-fg)]",
  {
    variants: {
      size: {
        xs: "h-[var(--select-height-xs)]",
        sm: "h-[var(--select-height-sm)]",
        md: "h-[var(--select-height-md)]",
        lg: "h-[var(--select-height-lg)]",
        default: "h-[var(--select-height-md)]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface SelectProps extends React.ComponentProps<
  typeof SelectPrimitive.Root
> {
  "aria-invalid"?: boolean | "true";
}

export function Select({ "aria-invalid": ariaInvalid, ...props }: SelectProps) {
  return (
    <SelectFieldStateContext.Provider value={{ invalid: ariaInvalid }}>
      <SelectPrimitive.Root data-slot="select" {...props} />
    </SelectFieldStateContext.Provider>
  );
}

export function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

export function SelectTrigger({
  className,
  size = "default",
  useFilledCaretIcon = false,
  filled,
  children,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: SelectSize;
  useFilledCaretIcon?: boolean;
  filled?: boolean;
}) {
  const selectFieldState = React.useContext(SelectFieldStateContext);
  const resolvedInvalid = ariaInvalid ?? selectFieldState.invalid;

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-filled={filled ? "true" : undefined}
      aria-invalid={resolvedInvalid}
      className={cn(selectTriggerVariants({ size }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {useFilledCaretIcon ? (
          <FilledCaretDownIcon className="size-4  transition-transform duration-200 group-data-[state=open]:rotate-180" />
        ) : (
          <ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        )}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  header,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  header?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-[color:var(--select-content-bg)] text-[color:var(--select-item-fg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) w-max min-w-[var(--select-content-min-width)] max-w-[calc(100vw-1rem)] origin-(--radix-select-content-transform-origin) overflow-x-hidden rounded-[var(--select-content-radius)] border border-[color:var(--select-content-border)] shadow-none [--select-content-min-width:12rem]",
          header ? "flex flex-col" : "overflow-y-auto",
          position === "popper" &&
            "max-w-[var(--radix-select-content-available-width)] [--select-content-min-width:max(12rem,var(--radix-select-trigger-width))] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        {header}
        <SelectPrimitive.Viewport
          className={cn(
            "w-max min-w-full max-w-full p-[var(--select-content-padding)]",
            header && "flex-1 min-h-0 overflow-y-auto",
            position === "popper" && "scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-[var(--select-item-padding-x)] py-[var(--select-item-padding-y)] text-[length:var(--select-font-size)] leading-[var(--select-line-height)] font-semibold text-[color:var(--select-label-fg)]",
        className
      )}
      {...props}
    />
  );
}

export function SelectItem({
  className,
  children,
  textValue,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-max min-w-full max-w-full cursor-default items-center gap-2 rounded-[var(--select-item-radius)] py-[var(--select-item-padding-y)] pr-[calc(var(--select-item-padding-x)+1.5rem)] pl-[var(--select-item-padding-x)] text-[length:var(--select-font-size)] leading-[var(--select-line-height)] font-medium tracking-[var(--select-letter-spacing)] text-[color:var(--select-item-fg)] outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--select-disabled-opacity)] data-[highlighted]:bg-[color:var(--select-item-bg-hover)] data-[highlighted]:text-[color:var(--select-item-fg)] data-[state=checked]:bg-[color:var(--select-item-bg-selected)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      textValue={textValue}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-[var(--select-item-padding-x)] flex size-4 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-brand-red" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {textValue != null ? (
        <>
          <span className="hidden">
            <SelectPrimitive.ItemText>{textValue}</SelectPrimitive.ItemText>
          </span>
          {children}
        </>
      ) : (
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      )}
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

export function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

export function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}
