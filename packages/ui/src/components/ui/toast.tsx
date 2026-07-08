"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import {
  XIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "../../lib/utils";
import {
  ToastProvider,
  setToastNotifier,
  useToast,
  useToastNotifier,
  type ToastPayload,
  type ToastVariant,
} from "./use-toast";

const variantStyles: Record<
  ToastVariant,
  { root: string; icon: React.ReactNode }
> = {
  default: {
    root: "border-border bg-card text-card-foreground",
    icon: null,
  },
  success: {
    root: "bg-green-100 border-green-200 [&_[data-icon]]:text-green-600 text-green-800",
    icon: <CheckCheckIcon className="w-5 h-5 shrink-0" data-icon />,
  },
  error: {
    root: "bg-red-100 border-red-200 [&_[data-icon]]:text-red-600 text-red-800",
    icon: <TriangleAlertIcon className="w-5 h-5 shrink-0" data-icon />,
  },
  warning: {
    root: "bg-orange-100 border-orange-200 [&_[data-icon]]:text-orange-600 text-orange-800",
    icon: <AlertTriangleIcon className="w-5 h-5 shrink-0" data-icon />,
  },
  info: {
    root: "bg-sky-100 border-sky-200 [&_[data-icon]]:text-sky-600 text-sky-800",
    icon: <InfoIcon className="w-5 h-5 shrink-0" data-icon />,
  },
};

const ToastItem = ({
  payload,
  onClose,
}: {
  payload: ToastPayload;
  onClose: () => void;
}) => {
  const { root: rootClass, icon } = variantStyles[payload.variant ?? "default"];

  return (
    <ToastPrimitive.Root
      duration={payload.duration ?? 5000}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg",
        "min-w-[320px] max-w-[420px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
        rootClass
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1 space-y-0.5 pr-6">
        {payload.title && (
          <ToastPrimitive.Title className="text-sm font-semibold leading-tight">
            {payload.title}
          </ToastPrimitive.Title>
        )}
        <ToastPrimitive.Description className="text-sm font-medium leading-snug">
          {payload.description}
        </ToastPrimitive.Description>
      </div>
      <ToastPrimitive.Close
        aria-label="Close"
        className="absolute right-2 top-2 rounded-md p-1.5 text-current opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <XIcon className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
};

type ToasterProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  duration?: number;
};

const viewportPositionClasses = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
};

function ToasterInner({
  position = "bottom-right",
}: {
  position: ToasterProps["position"];
}) {
  const { toasts, addToast, remove } = useToast();

  useToastNotifier();

  React.useEffect(() => {
    setToastNotifier(addToast);
    return () => setToastNotifier(null);
  }, [addToast]);

  return (
    <>
      {toasts.map((payload) => (
        <ToastItem
          key={payload.id}
          payload={payload}
          onClose={() => remove(payload.id)}
        />
      ))}
      <ToastPrimitive.Viewport
        className={cn(
          "fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]",
          position && viewportPositionClasses[position]
        )}
      />
    </>
  );
}

function Toaster({ position = "bottom-right", duration = 5000 }: ToasterProps) {
  return (
    <ToastProvider duration={duration}>
      <ToastPrimitive.Provider swipeDirection="right">
        <ToasterInner position={position} />
      </ToastPrimitive.Provider>
    </ToastProvider>
  );
}

export { Toaster };
export { toast } from "./use-toast";
export type { ToasterProps };
