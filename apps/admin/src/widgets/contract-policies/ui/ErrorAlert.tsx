import { TriangleAlert } from "lucide-react";

interface ErrorAlertProps {
  message?: string;
  messages?: string[];
}

export function ErrorAlert({ message, messages }: ErrorAlertProps) {
  const rows = (messages?.length ? messages : message ? [message] : [])
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-3 rounded-[6px] bg-error-bg px-4 py-3"
      role="alert"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="flex flex-col gap-1">
        {rows.map((row, index) => (
          <p
            key={`${row}-${index}`}
            className="text-sm font-bold leading-5 text-destructive"
          >
            {row}
          </p>
        ))}
      </div>
    </div>
  );
}
