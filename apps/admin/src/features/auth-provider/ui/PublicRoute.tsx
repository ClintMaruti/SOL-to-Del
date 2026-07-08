import { PageLoader } from "@/shared/ui";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/entities/auth/model/auth-store";
import { getAppPathFromFrontendUrl } from "@/shared/lib/auth-config";
import { ROUTES } from "@/shared/lib/paths";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  // Get current route location (includes pathname, search query string, etc.)
  const location = useLocation();

  // Parse the URL query string (e.g., "?returnUrl=https://...")
  const searchParams = new URLSearchParams(location.search);
  // Extract the returnUrl parameter from query string (used for OAuth redirect flow)
  const returnUrl = searchParams.get("returnUrl");

  // AuthInitializer performs the single /auth/me check before routes render.
  // Re-checking here for OAuth returnUrl would re-enter loading and flash a second spinner.

  // Show loading state while checking auth
  if (isLoading) {
    return <PageLoader variant="fullscreen" />;
  }

  // Redirect authenticated users away from public routes (like login)
  if (isAuthenticated) {
    // Check for returnUrl in query params (set by OAuth redirect)
    // returnUrl will be a full URL (e.g., https://frontend.com/admin/path), extract pathname
    const to: string = returnUrl
      ? getAppPathFromFrontendUrl(returnUrl)
      : ROUTES.DESTINATIONS;

    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
