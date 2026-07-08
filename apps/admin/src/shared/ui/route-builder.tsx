import { PageLoader } from "./PageLoader";
import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";

import { ProtectedRoute, PublicRoute } from "@/features/auth-provider";
import { ROUTES } from "@/shared/lib/paths";
import type { RouteConfig } from "@/shared/types/route-config";
import type { ReleaseId } from "@/shared/lib/release-flags";
import { isReleaseEnabled } from "@/shared/lib/release-flags";
import { MainLayout } from "@/widgets/main-layout";
import { useAuthStore } from "@/entities/auth/model/auth-store";

function SmartPageSkeleton() {
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  // Don't show Suspense loader if auth is still loading
  // Auth layer already shows fullscreen spinner
  if (isAuthLoading) {
    return null;
  }

  // Auth done, show page loader for chunk loading
  return <PageLoader />;
}

function wrapWithSuspense(element: RouteConfig["element"]): React.ReactNode {
  const content = React.isValidElement(element)
    ? element
    : React.createElement(element as React.ComponentType);
  return <Suspense fallback={<SmartPageSkeleton />}>{content}</Suspense>;
}

function ReleaseGuard({
  releaseId,
  children,
}: {
  releaseId: ReleaseId;
  children: React.ReactNode;
}) {
  if (!isReleaseEnabled(releaseId)) {
    return <Navigate to={ROUTES.DESTINATIONS} replace />;
  }
  return <>{children}</>;
}

/**
 * Builds the wrapped element for a route based on config.
 * Handles ProtectedRoute, ReleaseGuard, MainLayout wrapping, and Suspense for lazy components.
 */
function buildRouteElement(config: RouteConfig): React.ReactNode {
  const { element, releaseId, public: isPublic, layout = true } = config;
  const resolvedElement = wrapWithSuspense(element);

  if (isPublic) {
    return (
      <PublicRoute>
        {layout ? <MainLayout>{resolvedElement}</MainLayout> : resolvedElement}
      </PublicRoute>
    );
  }

  let content: React.ReactNode = resolvedElement;
  if (releaseId) {
    content = (
      <ReleaseGuard releaseId={releaseId}>
        <MainLayout>{content}</MainLayout>
      </ReleaseGuard>
    );
  } else if (layout) {
    content = <MainLayout>{content}</MainLayout>;
  }

  return <ProtectedRoute>{content}</ProtectedRoute>;
}

/** Component wrapper for buildRouteElement - required for Fast Refresh (file must only export components). */
export function BuildRouteElement({ config }: { config: RouteConfig }) {
  return <>{buildRouteElement(config)}</>;
}
