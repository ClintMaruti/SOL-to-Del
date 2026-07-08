import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { normalizeValidationErrorsFromBody } from "./validation-response";

// Standard API response wrapper from backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly data: unknown;
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    statusText: string,
    data?: unknown,
    validationErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.validationErrors = validationErrors;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  isValidationError(): boolean {
    return (
      (this.status === 400 || this.status === 422) &&
      this.validationErrors !== undefined
    );
  }
}

/**
 * Extract a user-visible message from JSON error bodies (RFC 7807 Problem Details,
 * ASP.NET validation wrappers, legacy `{ error }`, etc.).
 */
export function messageFromResponseBody(data: unknown): string | undefined {
  if (data == null || typeof data !== "object") {
    return undefined;
  }
  const o = data as Record<string, unknown>;
  const pick = (v: unknown) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
  return (
    pick(o.detail) ??
    pick(o.message) ??
    pick(o.Message) ??
    pick(o.error) ??
    pick(o.title)
  );
}

/**
 * Validation error structure returned by API on 422 Unprocessable Entity
 * Used across all endpoints that return validation errors
 */
export interface ValidationError {
  propertyName: string;
  errorMessage: string;
}

// Create axios instance with default configuration
function createApiClient(): AxiosInstance {
  // When MSW is enabled, use relative paths so MSW can intercept requests
  // MSW service workers cannot intercept cross-origin requests
  const useMSW =
    import.meta.env.VITE_USE_MSW !== "false" && import.meta.env.DEV;

  let baseURL: string;
  if (useMSW) {
    // Use relative path for MSW interception
    baseURL = "/api";
  } else {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

    // If VITE_API_BASE_URL is already a relative path (starts with /), use it directly
    // This handles CloudFront deployments where API is same-origin (e.g., VITE_API_BASE_URL="/api")
    // Otherwise, treat it as a full backend URL and append /api (e.g., VITE_API_BASE_URL="https://api.example.com")
    if (apiBaseUrl.startsWith("/")) {
      baseURL = apiBaseUrl;
    } else {
      baseURL = `${apiBaseUrl}/api`;
    }
  }

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // Include httpOnly cookies in requests
  });

  // Request interceptor for logging/modification
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // You can add auth tokens, logging, etc. here
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling API response wrapper
  instance.interceptors.response.use(
    (response) => {
      // Handle the { success, data, error } wrapper pattern
      const responseData = response.data as ApiResponse<unknown>;

      if (responseData && typeof responseData === "object") {
        // Only process wrapper pattern if response has 'success' property
        // Some endpoints (like /api/auth/me) return data directly without wrapper
        if ("success" in responseData) {
          if (!responseData.success) {
            // API returned success: false
            throw new ApiError(
              responseData.error || "Request failed",
              response.status,
              response.statusText,
              responseData
            );
          }
          // Unwrap the data for convenience
          response.data = responseData.data;
        }
        // If no 'success' property, pass through response as-is (e.g., /api/auth/me)
      }

      return response;
    },
    (error: AxiosError<ApiResponse<unknown>>) => {
      // Handle HTTP errors (4xx, 5xx)
      if (error.response) {
        const { status, statusText, data } = error.response;

        // Handle 404 - often returns empty body or just status text
        if (status === 404) {
          const msg = messageFromResponseBody(data) ?? "Resource not found";
          throw new ApiError(msg, status, statusText, data);
        }

        // Handle 400/422 — object `errors` map and array `{ propertyName, errorMessage }[]`
        if ((status === 400 || status === 422) && data != null) {
          const normalized = normalizeValidationErrorsFromBody(data);
          if (normalized && Object.keys(normalized).length > 0) {
            const fromArray =
              Array.isArray(data) &&
              data.length > 0 &&
              typeof data[0] === "object" &&
              data[0] !== null &&
              typeof (data[0] as { errorMessage?: unknown }).errorMessage ===
                "string"
                ? (data[0] as { errorMessage: string }).errorMessage.trim()
                : "";
            const message =
              messageFromResponseBody(data) ??
              (fromArray || "Validation failed");
            throw new ApiError(message, status, statusText, data, normalized);
          }
        }

        // Problem Details (`detail`), legacy `{ message }`, `{ error }`, etc.
        const message =
          messageFromResponseBody(data) ?? `Request failed: ${statusText}`;

        throw new ApiError(message, status, statusText, data);
      }

      // Handle network errors
      if (error.request) {
        throw new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        );
      }

      // Handle other errors
      throw new ApiError(
        error.message || "An unexpected error occurred",
        0,
        "Unknown Error"
      );
    }
  );

  return instance;
}

// Singleton instance
export const apiClient = createApiClient();

// Convenience methods with proper typing
export const api = {
  /**
   * GET request - data is automatically unwrapped from { success, data } wrapper
   */
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get<T>(url, config).then((res) => res.data),

  /**
   * POST request - data is automatically unwrapped from { success, data } wrapper
   */
  post: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => apiClient.post<T>(url, data, config).then((res) => res.data),

  /**
   * PUT request - data is automatically unwrapped from { success, data } wrapper
   */
  put: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => apiClient.put<T>(url, data, config).then((res) => res.data),

  /**
   * PATCH request - data is automatically unwrapped from { success, data } wrapper
   */
  patch: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  /**
   * DELETE request - data is automatically unwrapped from { success, data } wrapper
   */
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};
