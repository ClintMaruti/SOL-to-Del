import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

worker.listHandlers().forEach(() => {
  // MSW will pass through requests not explicitly handled
});
