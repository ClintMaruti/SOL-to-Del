import { Check, Copy } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

// --- Context for coordinating "only one Copied! at a time" ---

interface CopyableCellContextValue {
  copiedId: string | null;
  copy: (id: string, value: string) => void;
}

const CopyableCellContext = createContext<CopyableCellContextValue | null>(
  null
);

/**
 * Wrap a group of `CopyableCell` components with this provider
 * so that only one "Copied!" notification shows at a time.
 */
export function CopyableCellGroup({ children }: { children: ReactNode }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback((id: string, value: string) => {
    navigator.clipboard.writeText(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setCopiedId(id);
    timeoutRef.current = setTimeout(() => {
      setCopiedId(null);
      timeoutRef.current = null;
    }, 2000);
  }, []);

  return (
    <CopyableCellContext.Provider value={{ copiedId, copy }}>
      {children}
    </CopyableCellContext.Provider>
  );
}

// --- CopyableCell component ---

interface CopyableCellProps {
  /** The text to display and copy */
  value: string;
  /** Unique identifier for this cell (used to track which cell was copied) */
  cellId: string;
  /** When true, long text wraps instead of truncating (e.g. detail strips). Default: truncate for table cells. */
  wrap?: boolean;
}

export function CopyableCell({
  value,
  cellId,
  wrap = false,
}: CopyableCellProps) {
  const { t } = useTranslation("common");
  const context = useContext(CopyableCellContext);

  // Fallback: self-contained state if no provider is present
  const [localCopiedId, setLocalCopiedId] = useState<string | null>(null);
  const localTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCopied = context
    ? context.copiedId === cellId
    : localCopiedId === cellId;

  const handleCopy = useCallback(() => {
    if (context) {
      context.copy(cellId, value);
    } else {
      navigator.clipboard.writeText(value);

      if (localTimeoutRef.current) {
        clearTimeout(localTimeoutRef.current);
      }

      setLocalCopiedId(cellId);
      localTimeoutRef.current = setTimeout(() => {
        setLocalCopiedId(null);
        localTimeoutRef.current = null;
      }, 2000);
    }
  }, [context, cellId, value]);

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={handleCopy}
        className="group/copy flex w-full min-w-0 items-center gap-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t("aria.copyValue", { value })}
      >
        {isCopied ? (
          <Check className="size-3 shrink-0 text-green-500" />
        ) : (
          <Copy className="size-3 shrink-0 text-blue-500 transition-colors group-hover/copy:text-blue-700" />
        )}
        <span className={wrap ? "min-w-0 break-words" : "min-w-0 truncate"}>
          {value}
        </span>
      </button>
      {isCopied && (
        <span className="absolute -top-7 left-0 bg-neutral-900 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          {t("messages.copied")}
        </span>
      )}
    </div>
  );
}
