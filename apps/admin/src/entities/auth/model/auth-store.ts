import { api } from "@sol/api-client";
import { create } from "zustand";

import type { User } from "./types";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

type AuthCheckResponse = {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  roles?: string[];
};

let authCheckPromise: Promise<boolean> | null = null;

/**
 * Authentication store using httpOnly cookies.
 *
 * Tokens are managed server-side via httpOnly cookies.
 * The client cannot read or write tokens directly.
 * Authentication state is determined by calling /api/auth/me endpoint.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Set user data after successful authentication.
   * Token is stored in httpOnly cookie by the server, not by the client.
   */
  setUser: (user: User | null) => {
    if (user) {
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Clear local auth state.
   * Server-side cookie is cleared by the logout API endpoint.
   */
  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Check authentication status by calling /api/auth/me endpoint.
   * The server validates the httpOnly cookie and returns user data if valid.
   * Response format: { isAuthenticated: boolean, userId?, email?, roles? }
   */
  checkAuth: () => {
    if (authCheckPromise) {
      return authCheckPromise;
    }

    // Set loading state at the start to prevent race conditions.
    set({ isLoading: true });

    authCheckPromise = (async () => {
      try {
        const data = await api.get<AuthCheckResponse>("/auth/me");

        if (data.isAuthenticated && data.userId && data.email) {
          set({
            user: {
              userId: data.userId,
              email: data.email,
              roles: data.roles || [],
            },
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        // User is not authenticated.
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      } catch (error) {
        console.error("Failed to check auth:", error);
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      } finally {
        authCheckPromise = null;
      }
    })();

    return authCheckPromise;
  },
}));
