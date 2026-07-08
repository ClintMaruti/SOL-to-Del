import { FieldGroup, cn } from "@sol/ui";
import type { AnyFieldApi } from "@tanstack/react-form";
import * as React from "react";
import type { ReactNode } from "react";

import { fieldDomId } from "./fieldDomId";
import type { AnyFormApi } from "./types";

interface FormFieldProps {
  /** The form instance returned by `useForm()` */
  form: AnyFormApi;
  /** Field name — must match a key in the form's `defaultValues` */
  name: string;
  /** Prepended to DOM ids so fields are unique when several forms share path names */
  htmlIdPrefix?: string;
  /**
   * When the control is a Radix `Select` root, cloned `id` does not reach the trigger.
   * Set `suppressDomId` and put `id={fieldDomId(htmlIdPrefix, name)}` on `SelectTrigger` (or similar).
   */
  suppressDomId?: boolean;
  /**
   * Associate the label via `id` + `aria-labelledby` on the control instead of `label for` + control `id`
   * (required for composite widgets like Radix ToggleGroup where `for` must not point at the group root for audits).
   */
  useAriaLabelledBy?: boolean;
  /** Label above the input (string or custom node, e.g. design-specific required marker) */
  label?: ReactNode;
  /** Renders a red asterisk next to the label */
  required?: boolean;
  /** TanStack Form field validators (`onChange`, `onBlur`, `onSubmit`, etc.) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validators?: Record<string, any>;
  /** Render prop — receives the TanStack Form field API */
  children: (field: AnyFieldApi) => ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Error message to display */
  error?: string;
  /** When true, suppresses inline error display (useful when errors are shown elsewhere) */
  hideError?: boolean;
  /** Optional top-right metadata text */
  topRightLabel?: ReactNode;
  /** Optional bottom-left helper text */
  bottomLeftLabel?: ReactNode;
  /** Optional bottom-right helper text */
  bottomRightLabel?: ReactNode;
}

/**
 * Form field wrapper that combines TanStack Form's `form.Field` with
 * shadcn/ui Label and consistent error display.
 *
 * Internally renders `form.Field`, so the consumer doesn't need to.
 *
 * @example
 * ```tsx
 * <FormField form={form} name="email" label="Email" required>
 *   {(field) => (
 *     <Input
 *       value={field.state.value}
 *       onChange={(e) => field.handleChange(e.target.value)}
 *       onBlur={field.handleBlur}
 *       aria-invalid={!field.state.meta.isValid}
 *     />
 *   )}
 * </FormField>
 * ```
 */
export function FormField({
  form,
  name,
  htmlIdPrefix,
  suppressDomId = false,
  useAriaLabelledBy = false,
  label,
  required,
  validators,
  children,
  className,
  error,
  hideError,
  topRightLabel,
  bottomLeftLabel,
  bottomRightLabel,
}: FormFieldProps) {
  return (
    <form.Field name={name} validators={validators}>
      {(field: AnyFieldApi) => {
        const domId = fieldDomId(htmlIdPrefix, name);
        const labelControlId = useAriaLabelledBy ? `${domId}-label` : undefined;
        const fieldError = getFirstFieldError(field.state.meta.errors) ?? error;
        const inlineError = hideError ? undefined : fieldError;
        const content = withFieldState(
          children(field),
          domId,
          Boolean(fieldError),
          suppressDomId,
          useAriaLabelledBy && labelControlId
            ? { ariaLabelledBy: labelControlId }
            : undefined
        );

        return (
          <FieldGroup
            htmlFor={useAriaLabelledBy ? undefined : domId}
            labelElementId={labelControlId}
            label={label}
            required={required}
            topRightLabel={topRightLabel}
            bottomLeftLabel={bottomLeftLabel}
            bottomRightLabel={bottomRightLabel}
            error={inlineError}
            className={cn("w-full", className)}
          >
            {content}
          </FieldGroup>
        );
      }}
    </form.Field>
  );
}

function getFirstFieldError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string") {
      return error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
  }

  return undefined;
}

type WithFieldStateOptions = {
  ariaLabelledBy: string;
};

function withFieldState(
  node: ReactNode,
  domId: string,
  isInvalid: boolean,
  suppressDomId: boolean,
  options?: WithFieldStateOptions
): ReactNode {
  if (!React.isValidElement(node)) {
    return node;
  }

  const props = node.props as {
    id?: string;
    name?: string;
    "aria-invalid"?: boolean | string;
  };
  const currentId = props.id;
  const currentName = props.name;
  const currentInvalid = props["aria-invalid"];

  if (options?.ariaLabelledBy) {
    return React.cloneElement(
      node as React.ReactElement<Record<string, unknown>>,
      {
        "aria-labelledby": options.ariaLabelledBy,
        "aria-invalid": currentInvalid ?? (isInvalid ? "true" : undefined),
      }
    );
  }

  const idAndName = suppressDomId
    ? {}
    : {
        id: currentId ?? domId,
        name:
          typeof currentName === "string" && currentName !== ""
            ? currentName
            : domId,
      };

  return React.cloneElement(
    node as React.ReactElement<Record<string, unknown>>,
    {
      ...idAndName,
      "aria-invalid": currentInvalid ?? (isInvalid ? "true" : undefined),
    }
  );
}
