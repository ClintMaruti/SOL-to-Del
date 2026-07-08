import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../../lib/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-[color:var(--dropdown-menu-content-bg)] text-[color:var(--dropdown-menu-item-fg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[12rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--dropdown-menu-content-radius)] border border-[color:var(--dropdown-menu-content-border)] p-[var(--dropdown-menu-content-padding)] shadow-none",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-[var(--dropdown-menu-item-gap)] rounded-[var(--dropdown-menu-item-radius)] px-[var(--dropdown-menu-item-padding-x)] py-[var(--dropdown-menu-item-padding-y)] text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] outline-hidden select-none data-[highlighted]:bg-[color:var(--dropdown-menu-item-bg-hover)] data-[highlighted]:text-[color:var(--dropdown-menu-item-fg)] data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--dropdown-menu-disabled-opacity)] data-[variant=destructive]:text-[color:var(--dropdown-menu-item-fg-destructive)] data-[variant=destructive]:data-[highlighted]:bg-[color:var(--dropdown-menu-item-bg-hover)] data-[variant=destructive]:data-[highlighted]:text-[color:var(--dropdown-menu-item-fg-destructive)] data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[color:var(--dropdown-menu-icon-fg)]",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-[var(--dropdown-menu-item-gap)] rounded-[var(--dropdown-menu-item-radius)] py-[var(--dropdown-menu-item-padding-y)] pr-[var(--dropdown-menu-item-padding-x)] pl-8 text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] outline-hidden select-none data-[highlighted]:bg-[color:var(--dropdown-menu-item-bg-hover)] data-[highlighted]:text-[color:var(--dropdown-menu-item-fg)] data-[state=checked]:bg-[color:var(--dropdown-menu-item-bg-selected)] data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--dropdown-menu-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-[var(--dropdown-menu-item-padding-x)] flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-brand-red" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-[var(--dropdown-menu-item-gap)] rounded-[var(--dropdown-menu-item-radius)] py-[var(--dropdown-menu-item-padding-y)] pr-[var(--dropdown-menu-item-padding-x)] pl-8 text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] outline-hidden select-none data-[highlighted]:bg-[color:var(--dropdown-menu-item-bg-hover)] data-[highlighted]:text-[color:var(--dropdown-menu-item-fg)] data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--dropdown-menu-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-[var(--dropdown-menu-item-padding-x)] flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current text-brand-red" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-[var(--dropdown-menu-item-padding-x)] py-[var(--dropdown-menu-item-padding-y)] text-[length:var(--dropdown-menu-label-font-size)] leading-[var(--dropdown-menu-label-line-height)] font-semibold text-[color:var(--dropdown-menu-label-fg)] data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "mx-[var(--dropdown-menu-content-padding)] my-1 h-px bg-[color:var(--dropdown-menu-separator-bg)]",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-[length:var(--dropdown-menu-shortcut-font-size)] leading-[var(--dropdown-menu-shortcut-line-height)] font-medium tracking-[var(--dropdown-menu-shortcut-letter-spacing)] text-[color:var(--dropdown-menu-shortcut-fg)]",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-[var(--dropdown-menu-item-gap)] rounded-[var(--dropdown-menu-item-radius)] px-[var(--dropdown-menu-item-padding-x)] py-[var(--dropdown-menu-item-padding-y)] text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] outline-hidden select-none data-[state=open]:bg-[color:var(--dropdown-menu-item-bg-hover)] data-[highlighted]:bg-[color:var(--dropdown-menu-item-bg-hover)] data-[highlighted]:text-[color:var(--dropdown-menu-item-fg)] data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[color:var(--dropdown-menu-icon-fg)]",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-[color:var(--dropdown-menu-content-bg)] text-[color:var(--dropdown-menu-item-fg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-[var(--dropdown-menu-content-radius)] border border-[color:var(--dropdown-menu-content-border)] p-[var(--dropdown-menu-content-padding)] shadow-none",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
