import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Cache retained for 10 minutes after component unmounts
        gcTime: 1000 * 60 * 10,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus by default (optional)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  });
}

// Export a singleton instance for SSR-safe usage
export const queryClient = createQueryClient();
