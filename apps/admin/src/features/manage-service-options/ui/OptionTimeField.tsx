import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";
import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

import type { OptionFormFieldErrors } from "../model/apiValidationErrors";
import { isValid12HourTime } from "../model/is12HourTime";

import { TimePickerInput } from "./TimePickerInput";

type OptionTimeFieldName = "timeFrom" | "timeTo";

interface OptionTimeFieldProps {
  form: AnyFormApi;
  name: OptionTimeFieldName;
  label: string;
  placeholder: string;
  required: boolean;
  htmlIdPrefix?: string;
  error?: string;
  onFieldChange?: (field: keyof OptionFormFieldErrors) => void;
  showValidationErrorState?: boolean;
}

export function OptionTimeField({
  form,
  name,
  label,
  placeholder,
  required,
  htmlIdPrefix,
  error,
  onFieldChange,
  showValidationErrorState = false,
}: OptionTimeFieldProps) {
  const otherName = name === "timeFrom" ? "timeTo" : "timeFrom";

  return (
    <FormField
      form={form}
      name={name}
      label={label}
      htmlIdPrefix={htmlIdPrefix}
      required={required}
      error={error}
      validators={{
        onSubmit: ({ value }: { value: string }) => {
          const trimmed = String(value ?? "").trim();
          const otherTrimmed = String(
            form.getFieldValue(otherName) ?? ""
          ).trim();

          if (required) {
            if (!trimmed) return VALIDATION_MESSAGES.required(label);
            if (!isValid12HourTime(trimmed)) {
              return VALIDATION_MESSAGES.time12HourFormat(label);
            }
            return undefined;
          }

          if (Boolean(trimmed) !== Boolean(otherTrimmed)) {
            return VALIDATION_MESSAGES.timeFromTimeToPair();
          }
          if (trimmed && !isValid12HourTime(trimmed)) {
            return VALIDATION_MESSAGES.time12HourFormat(label);
          }
          return undefined;
        },
      }}
    >
      {(field) => {
        const hasValidationError = field.state.meta.errors.length > 0;

        return (
          <TimePickerInput
            value={String(field.state.value ?? "")}
            onChange={(value) => {
              onFieldChange?.(name);
              field.handleChange(value);
            }}
            onBlur={field.handleBlur}
            label={label}
            placeholder={placeholder}
            aria-invalid={
              showValidationErrorState && hasValidationError
                ? "true"
                : undefined
            }
            className={
              showValidationErrorState && hasValidationError
                ? "border-destructive"
                : undefined
            }
          />
        );
      }}
    </FormField>
  );
}
