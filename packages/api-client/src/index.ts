export { initMSW } from "./msw";
export { QueryProvider } from "./providers/QueryProvider";
export { createQueryClient, queryClient } from "./query-client";

// API client exports
export {
  api,
  apiClient,
  ApiError,
  messageFromResponseBody,
} from "./api-client";
export { normalizeValidationErrorsFromBody } from "./validation-response";
export type { ApiResponse, ValidationError } from "./api-client";

// Error utilities
export {
  getValidationErrors,
  getFieldError,
  toFormErrors,
  getErrorMessage,
} from "./error-utils";
export type { ValidationResult } from "./error-utils";

// Re-export commonly used hooks for convenience
export {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
