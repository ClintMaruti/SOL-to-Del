"use client";

import * as React from "react";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastPayload = {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastState = {
  toasts: ToastPayload[];
};

type ToastAction =
  | { type: "ADD"; payload: ToastPayload }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string };

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD":
      return { toasts: [...state.toasts, action.payload] };
    case "DISMISS":
      return state;
    case "REMOVE":
      return {
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    default:
      return state;
  }
}

type ToastContextValue = {
  toasts: ToastPayload[];
  addToast: (payload: Omit<ToastPayload, "id">) => string;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

let toastId = 0;
function generateId() {
  return `toast-${Date.now()}-${++toastId}`;
}

/** Ref used by imperative toast() API so it works outside React tree */
let addToastRef: ToastContextValue["addToast"] | null = null;

export function setToastNotifier(fn: ToastContextValue["addToast"] | null) {
  addToastRef = fn;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a Toaster (ToastProvider)");
  }
  return ctx;
}

export function useToastNotifier() {
  const ctx = React.useContext(ToastContext);
  React.useEffect(() => {
    if (ctx) {
      addToastRef = ctx.addToast;
      return () => {
        addToastRef = null;
      };
    }
  }, [ctx]);
}

export function ToastProvider({
  children,
  duration = 5000,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });

  const addToast = React.useCallback(
    (payload: Omit<ToastPayload, "id">) => {
      const id = generateId();
      dispatch({
        type: "ADD",
        payload: { ...payload, id, duration: payload.duration ?? duration },
      });
      return id;
    },
    [duration]
  );

  const dismiss = React.useCallback((id: string) => {
    dispatch({ type: "DISMISS", id });
  }, []);

  const remove = React.useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const value = React.useMemo(
    () => ({ toasts: state.toasts, addToast, dismiss, remove }),
    [state.toasts, addToast, dismiss, remove]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

function toastFn(
  message: string,
  options?: { title?: string; variant?: ToastVariant; duration?: number }
) {
  return addToastRef?.({
    description: message,
    title: options?.title,
    variant: options?.variant ?? "default",
    duration: options?.duration,
  });
}

toastFn.success = (
  message: string,
  options?: { title?: string; duration?: number }
) => {
  return addToastRef?.({
    description: message,
    title: options?.title,
    variant: "success",
    duration: options?.duration,
  });
};

toastFn.error = (
  message: string,
  options?: { title?: string; duration?: number }
) => {
  return addToastRef?.({
    description: message,
    title: options?.title,
    variant: "error",
    duration: options?.duration,
  });
};

toastFn.warning = (
  message: string,
  options?: { title?: string; duration?: number }
) => {
  return addToastRef?.({
    description: message,
    title: options?.title,
    variant: "warning",
    duration: options?.duration,
  });
};

toastFn.info = (
  message: string,
  options?: { title?: string; duration?: number }
) => {
  return addToastRef?.({
    description: message,
    title: options?.title,
    variant: "info",
    duration: options?.duration,
  });
};

/** Imperative API: call from anywhere. Requires Toaster to be mounted. */
export const toast = toastFn;
