import { api } from "@sol/api-client";
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "./auth-store";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockGet = vi.mocked(api.get);
const originalCheckAuth = useAuthStore.getState().checkAuth;

describe("auth store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      checkAuth: originalCheckAuth,
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      checkAuth: originalCheckAuth,
    });
  });

  it("reuses an in-flight auth check and updates auth state once", async () => {
    const snapshots: Array<{
      isAuthenticated: boolean;
      isLoading: boolean;
      userId: string | null;
    }> = [];
    const unsubscribe = useAuthStore.subscribe((state) => {
      snapshots.push({
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        userId: state.user?.userId ?? null,
      });
    });

    let resolveAuth!: (value: {
      isAuthenticated: boolean;
      userId: string;
      email: string;
      roles: string[];
    }) => void;
    mockGet.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAuth = resolve;
      }) as ReturnType<typeof api.get>
    );

    const first = useAuthStore.getState().checkAuth();
    const second = useAuthStore.getState().checkAuth();

    expect(second).toBe(first);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/auth/me");
    expect(useAuthStore.getState().isLoading).toBe(true);

    await act(async () => {
      resolveAuth({
        isAuthenticated: true,
        userId: "user-1",
        email: "user@example.com",
        roles: ["admin"],
      });
      await first;
      await second;
    });

    unsubscribe();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      isLoading: false,
      user: {
        userId: "user-1",
        email: "user@example.com",
        roles: ["admin"],
      },
    });
    expect(snapshots).toEqual([
      { isAuthenticated: false, isLoading: true, userId: null },
      { isAuthenticated: true, isLoading: false, userId: "user-1" },
    ]);
  });
});
