import { Button, Card, CardContent } from "@sol/ui";
import { FileX } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";

import { ROUTES } from "@/shared/lib/paths";

/**
 * Error boundary for React Router routes. Renders when loaders, actions,
 * or component rendering throw. Provides friendly UX instead of the default
 * "Unexpected Application Error!" screen.
 */
export function RouteErrorBoundary() {
  const { t } = useTranslation("common");
  const error = useRouteError();
  const navigate = useNavigate();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  const notFoundIcon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <FileX className="h-6 w-6 text-blue-600" />
    </div>
  );

  if (is404) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="mb-6">{notFoundIcon}</div>
            <h2 className="text-lg font-bold text-foreground leading-8 mb-2">
              {t("errors.pageNotFound")}
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-6 max-w-md mb-6">
              {t("errors.pageNotFoundDescription")}
            </p>
            <Button onClick={() => navigate(ROUTES.DESTINATIONS)}>
              {t("buttons.goToHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const errorMessage =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full border-none shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <h2 className="text-lg font-bold text-foreground leading-8 mb-2">
            {t("errors.somethingWentWrong")}
          </h2>
          <p className="text-sm text-muted-foreground font-medium leading-6 max-w-md mb-6">
            {t("errors.unexpectedError")}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              {t("buttons.goBack")}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate(ROUTES.DESTINATIONS)}
            >
              {t("buttons.goToHome")}
            </Button>
            <Button onClick={() => window.location.reload()}>
              {t("buttons.tryAgain")}
            </Button>
          </div>
          {import.meta.env.DEV && (
            <details className="mt-6 w-full max-w-md text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                {t("errors.errorDetailsDev")}
              </summary>
              <pre className="mt-2 p-4 rounded-md bg-muted text-xs overflow-auto max-h-32">
                {errorMessage}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
