import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/entities/auth/model/auth-store";

import { AuthInitializer } from "../Providers";

const { mockFindRoutePreload } = vi.hoisted(() => ({
  mockFindRoutePreload: vi.fn(),
}));

vi.mock("@/App", () => ({
  default: () => null,
}));

vi.mock("@/shared/lib/route-preload", () => ({
  findRoutePreload: mockFindRoutePreload,
}));

const originalCheckAuth = useAuthStore.getState().checkAuth;

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("AuthInitializer", () => {
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

  it("keeps the fullscreen loader visible until the matched route preload resolves", async () => {
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

    const deferred = createDeferred();
    const routePreload = vi.fn(() => deferred.promise);
    mockFindRoutePreload.mockReturnValue(routePreload);

    render(
      <MemoryRouter
        initialEntries={[
          "/database/destinations/suppliers/sup-1/services/service-1?tab=options",
        ]}
      >
        <AuthInitializer>
          <div>Loaded supplier service route</div>
        </AuthInitializer>
      </MemoryRouter>
    );

    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(screen.queryByText("Loaded supplier service route")).toBeNull();

    await waitFor(() => {
      expect(routePreload).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      deferred.resolve();
      await deferred.promise;
    });

    expect(screen.getByText("Loaded supplier service route")).toBeDefined();
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });
});
