import { QueryProvider } from "@sol/api-client";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";

import "@sol/i18n"; // Initialize i18n
import App from "@/App";
import { useAuthStore } from "@/entities/auth/model/auth-store";
import { findRoutePreload } from "@/shared/lib/route-preload";
import { PageLoader, RouteErrorBoundary } from "@/shared/ui";

/**
 * Auth initializer: check authentication status via /api/auth/me endpoint.
 * Root providers: QueryProvider, then AuthInitializer, then App.
 * Uses a data router so useBlocker and other data APIs work.
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const location = useLocation();
  const [initialRouteChecked, setInitialRouteChecked] = useState(false);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const routePreload = useMemo(
    () => findRoutePreload(location.pathname),
    [location.pathname]
  );
  const shouldPreloadInitialRoute = isAuthenticated && Boolean(routePreload);

  useEffect(() => {
    if (isAuthLoading || initialRouteChecked) {
      return;
    }

    if (!shouldPreloadInitialRoute || !routePreload) {
      setInitialRouteChecked(true);
      return;
    }

    let cancelled = false;

    void routePreload()
      .catch((error) => {
        console.error("Failed to preload route:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setInitialRouteChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    initialRouteChecked,
    isAuthLoading,
    routePreload,
    shouldPreloadInitialRoute,
  ]);

  // Unauthenticated access is redirected by ProtectedRoute with ?returnUrl=...; do not navigate
  // to /login here — that would strip the deep link and send users to the default page after login.

  if (isAuthLoading || (shouldPreloadInitialRoute && !initialRouteChecked)) {
    return <PageLoader variant="fullscreen" />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter(
  [
    {
      path: "*",
      element: (
        <QueryProvider>
          <AuthInitializer>
            <App />
          </AuthInitializer>
        </QueryProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
  ],
  { basename: "/admin" }
);

export function Providers() {
  return <RouterProvider router={router} />;
}
