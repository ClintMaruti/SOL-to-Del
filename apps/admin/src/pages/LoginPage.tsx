import { Button } from "@sol/ui";
import cpsIcon from "@sol/ui/assets/CPS Icon.svg";
import cpsLogo from "@sol/ui/assets/CPS Logo.png";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import {
  getAppPathFromFrontendUrl,
  getLoginUrl,
} from "@/shared/lib/auth-config";
import { ROUTES } from "@/shared/lib/paths";

export function LoginPage() {
  const location = useLocation();
  const { t } = useTranslation(["admin", "common"]);

  const year = new Date().getFullYear();

  const handleLogin = () => {
    const searchParams = new URLSearchParams(location.search);
    const returnUrlParam = searchParams.get("returnUrl");

    let returnUrlPath: string;
    if (returnUrlParam) {
      // Set by ProtectedRoute: full frontend URL of the page the user wanted
      returnUrlPath = getAppPathFromFrontendUrl(returnUrlParam);
    } else {
      const currentPath = location.pathname + location.search;
      const defaultDashboardPath = ROUTES.DESTINATIONS;
      returnUrlPath =
        location.pathname === ROUTES.LOGIN ? defaultDashboardPath : currentPath;
    }
    window.location.href = getLoginUrl(returnUrlPath);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background watermark - ampersand */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <img src={cpsIcon} alt="" className="w-[600px] h-[600px] select-none" />
      </div>

      {/* Logo at top */}
      <div className="relative z-10 flex justify-center pt-8">
        <img
          src={cpsLogo}
          alt={t("admin:labels.loginLogoAlt")}
          className="h-24 w-auto"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-6 flex flex-col items-center">
          {/* Login Button */}
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleLogin}
            size="lg"
          >
            {t("admin:buttons.login")}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full text-center text-sm text-muted-foreground pb-6">
        {t("admin:labels.copyrightFooter", { year })}
      </div>
    </div>
  );
}
