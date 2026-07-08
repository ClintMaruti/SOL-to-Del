import { PageLoader } from "@/shared/ui";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/entities/auth/model/auth-store";
import { getFrontendUrl } from "@/shared/lib/auth-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // AuthInitializer performs the single /auth/me check before routes render.
  // Re-checking here would re-enter loading and flash a second spinner.

  if (isLoading) {
    return <PageLoader variant="fullscreen" />;
  }

  if (!isAuthenticated) {
    // Redirect to login with returnUrl query parameter
    // returnUrl should be the full frontend URL (not just path)
    const currentPath = location.pathname + location.search;
    const fullReturnUrl = getFrontendUrl(currentPath);
    const encodedReturnUrl = encodeURIComponent(fullReturnUrl);
    return <Navigate to={`/login?returnUrl=${encodedReturnUrl}`} replace />;
  }

  return <>{children}</>;
}
