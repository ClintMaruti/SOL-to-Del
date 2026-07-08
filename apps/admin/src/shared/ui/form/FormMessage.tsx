import { cn } from "@sol/ui";

interface FormMessageProps {
  /** Error messages — typically `field.state.meta.errors` or a single API error string */
  errors?: Array<string | undefined>;
  /** Convenience prop for a single message (e.g., API error) */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays form error messages in a consistent style.
 *
 * Accepts either an array of errors (from TanStack Form field meta)
 * or a single message string (for API-level errors).
 *
 * @example
 * ```tsx
 * // Field-level errors
 * <FormMessage errors={field.state.meta.errors} />
 *
 * // API error
 * <FormMessage message={apiError?.message} />
 * ```
 */
export function FormMessage({ errors, message, className }: FormMessageProps) {
  // Collect all truthy error strings
  const messages: string[] = [];

  if (errors) {
    for (const error of errors) {
      if (typeof error === "string") {
        messages.push(error);
      } else if (typeof error === "object" && Object.hasOwn(error, "message")) {
        messages.push((error as { message: string }).message);
      }
    }
  }

  if (message) {
    messages.push(message);
  }

  if (messages.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {messages.map((msg, index) => (
        <p key={index} className="text-sm text-destructive" role="alert">
          {msg}
        </p>
      ))}
    </div>
  );
}
