import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  readonly?: boolean;
}

const textareaVariants = cva(
  "box-border flex w-full min-w-0 rounded-[var(--textarea-radius)] border border-[color:var(--textarea-border-default)] bg-[color:var(--textarea-bg-empty)] px-[var(--textarea-padding-x)] py-[var(--textarea-padding-y)] text-[length:var(--textarea-font-size)] font-medium leading-[var(--textarea-line-height)] tracking-[var(--textarea-letter-spacing)] text-[color:var(--textarea-fg-filled)] placeholder:text-[color:var(--textarea-fg-placeholder)] placeholder:font-medium shadow-none outline-none transition-[background-color,color,border-color,border-radius,opacity] focus-visible:rounded-[var(--textarea-focus-radius)] focus-visible:border-[3px] focus-visible:border-[color:var(--textarea-border-focus)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-[var(--textarea-disabled-opacity)] disabled:border-[color:var(--textarea-border-default)] disabled:resize-none data-[filled=true]:bg-[color:var(--textarea-bg-filled)] data-[readonly=true]:pointer-events-none data-[readonly=true]:cursor-default aria-invalid:bg-[color:var(--textarea-bg-error)] aria-invalid:data-[filled=true]:bg-[color:var(--textarea-bg-error)] aria-invalid:border-[color:var(--textarea-border-error)] aria-invalid:focus-visible:border-[color:var(--textarea-border-error)]",
  {
    variants: {
      resize: {
        none: "resize-none",
        y: "resize-y",
        both: "resize",
      },
    },
    defaultVariants: {
      resize: "y",
    },
  }
);

function hasMeaningfulValue(value: React.ComponentProps<"textarea">["value"]) {
  if (typeof value === "string") {
    return value.length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value);
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      readonly,
      readOnly,
      disabled,
      onChange,
      value,
      defaultValue,
      tabIndex,
      rows,
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

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    };

    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        data-filled={hasValue ? "true" : "false"}
        data-readonly={isReadonly ? "true" : undefined}
        readOnly={isReadonly}
        disabled={disabled}
        rows={rows ?? 2}
        tabIndex={isReadonly ? -1 : tabIndex}
        className={cn(
          textareaVariants(),
          "min-h-[var(--textarea-min-height)]",
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

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
