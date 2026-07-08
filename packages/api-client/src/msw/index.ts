/**
 * Initialize MSW (Mock Service Worker) for browser environment
 * Only runs in development mode when VITE_USE_MSW is not set to 'false'
 * Set VITE_USE_MSW=false in .env to disable MSW and use real backend
 */
export async function initMSW() {
  // Skip MSW if explicitly disabled or not in dev mode
  const useMSW = import.meta.env.VITE_USE_MSW !== "false";
  if (!import.meta.env.DEV || !useMSW) {
    return Promise.resolve();
  }

  const { worker } = await import("./browser");

  // Use Vite's BASE_URL to construct the correct service worker path
  // BASE_URL is automatically set by Vite based on the 'base' config option
  // e.g., "/admin/" -> "/admin/mockServiceWorker.js"
  const baseUrl = import.meta.env.BASE_URL || "/";
  const serviceWorkerUrl = `${baseUrl}mockServiceWorker.js`.replace(
    /\/+/g,
    "/"
  );

  return worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: serviceWorkerUrl,
      options: { scope: baseUrl },
    },
    quiet: false,
  });
}
