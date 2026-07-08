import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/entities/auth/model/auth-store";

import { ProtectedRoute } from "../ui/ProtectedRoute";
import { PublicRoute } from "../ui/PublicRoute";

const originalCheckAuth = useAuthStore.getState().checkAuth;

describe("auth route guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      checkAuth: originalCheckAuth,
    });
  });

  it("does not re-check auth from ProtectedRoute", () => {
    const checkAuth = vi.fn().mockResolvedValue(true);
    useAuthStore.setState({
      user: {
        userId: "user-1",
        email: "user@example.com",
        roles: ["admin"],
      },
      isAuthenticated: true,
      isLoading: false,
      checkAuth,
    });

    render(
      <MemoryRouter initialEntries={["/database/destinations/suppliers"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected content")).toBeDefined();
    expect(checkAuth).not.toHaveBeenCalled();
  });

  it("does not re-check auth from PublicRoute", () => {
    const checkAuth = vi.fn().mockResolvedValue(false);
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      checkAuth,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <PublicRoute>
          <div>Public content</div>
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Public content")).toBeDefined();
    expect(checkAuth).not.toHaveBeenCalled();
  });
});
