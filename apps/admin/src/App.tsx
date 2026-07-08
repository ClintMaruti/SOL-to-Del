import { Toaster, TooltipProvider } from "@sol/ui";
import { Route, Routes, ScrollRestoration } from "react-router-dom";

import { routes } from "@/config/routes.config";
import { useRouteSync } from "@/shared/hooks";
import { BuildRouteElement } from "@/shared/ui";

function AppRoutes() {
  useRouteSync();

  return (
    <Routes>
      {routes.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={<BuildRouteElement config={r} />}
        />
      ))}
    </Routes>
  );
}

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <ScrollRestoration />
      <AppRoutes />
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
