import { QueryProvider, initMSW } from "@sol/api-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@sol/i18n"; // Initialize i18n

import "./index.css";
import App from "./App.tsx";

// Initialize MSW in development mode
initMSW().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </StrictMode>
  );
});
