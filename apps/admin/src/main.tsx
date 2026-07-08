import { initMSW } from "@sol/api-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./app/styles/index.css";
import { Providers } from "./app/providers";

// Initialize MSW in development mode
initMSW().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers />
    </StrictMode>
  );
});
