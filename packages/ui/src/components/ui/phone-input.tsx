// components/ui/phone-input.tsx
"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Input, type InputProps } from "./input";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhoneInputProps extends Omit<
  InputProps,
  "onChange" | "value"
> {
  value?: string;
  onChange?: (value: string, isValid: boolean) => void;
  className?: string;
  /** Error message — renders destructive ring AND error text below the input. */
  error?: string;
  /** Destructive ring only, no error text. Use when a parent (e.g. FormField) already renders the message. */
  invalid?: boolean;
}

// ─── Regex ────────────────────────────────────────────────────────────────────

// Strips everything except digits and leading +
const sanitize = (val: string): string => val.replace(/(?!^\+)[^\d]/g, "");

// Valid international format: + followed by 7–15 digits (ITU-T E.164)
const INTL_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

// ─── Dial-code detection (ITU-T E.164 zone assignments) ──────────────────────

const ONE_DIGIT_CODES = new Set(["1", "7"]);

const TWO_DIGIT_CODES = new Set([
  "20",
  "27",
  "30",
  "31",
  "32",
  "33",
  "34",
  "36",
  "39",
  "40",
  "41",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "81",
  "82",
  "84",
  "86",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "98",
]);

function getDialCodeLength(digits: string): number {
  if (ONE_DIGIT_CODES.has(digits.slice(0, 1))) return 1;
  if (TWO_DIGIT_CODES.has(digits.slice(0, 2))) return 2;
  return 3;
}

// e.g. "+254712345678" → "+254 712 345 678"
//      "+447911123456" → "+44 791 112 3456"
const formatDisplay = (val: string): string => {
  if (!val.startsWith("+")) return val;

  const digits = val.slice(1);
  if (digits.length === 0) return val;

  const codeLen = getDialCodeLength(digits);
  const dialCode = digits.slice(0, codeLen);
  const national = digits.slice(codeLen);

  if (!national) return `+${dialCode}`;

  const groups: string[] = [];
  let remaining = national;
  while (remaining.length > 0) {
    if (remaining.length <= 4) {
      groups.push(remaining);
      break;
    }
    groups.push(remaining.slice(0, 3));
    remaining = remaining.slice(3);
  }

  return `+${dialCode} ${groups.join(" ")}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PhoneInput({
  value = "",
  onChange,
  className,
  error,
  invalid,
  disabled,
  placeholder = "+254 712 345 678",
  ...rest
}: PhoneInputProps) {
  const ensurePlus = (v: string) => formatDisplay(v) || "+";

  const [display, setDisplay] = React.useState(() => ensurePlus(value));

  React.useEffect(() => {
    setDisplay(ensurePlus(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Always ensure leading +
    const withPlus = raw.startsWith("+") ? raw : `+${raw}`;

    // Sanitize: keep + at start, digits only after
    const sanitized = sanitize(withPlus);

    // If user deleted everything, keep just the "+"
    const formatted = sanitized === "+" ? "+" : formatDisplay(sanitized);

    // Strip spaces for the clean value emitted to parent
    const clean = formatted.replace(/\s/g, "");

    setDisplay(formatted);
    onChange?.(clean, INTL_PHONE_REGEX.test(clean));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent deleting the leading +
    const input = e.currentTarget;
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      input.selectionStart === 1 &&
      input.selectionEnd === 1
    ) {
      e.preventDefault();
    }
  };

  const showRing = !!(error || invalid);
  const isEmpty = display === "+";
  const inputPlaceholder =
    isEmpty && placeholder.startsWith("+") ? placeholder.slice(1) : placeholder;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="relative">
        {isEmpty && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground"
            aria-hidden
          >
            +
          </span>
        )}
        <Input
          {...rest}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={isEmpty ? "" : display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={inputPlaceholder}
          aria-invalid={showRing}
          aria-describedby={error ? "phone-error" : undefined}
          className={cn(
            "font-mono",
            isEmpty && "pl-6",
            showRing && "border-destructive focus-visible:ring-destructive"
          )}
        />
      </div>

      {error && (
        <p id="phone-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
