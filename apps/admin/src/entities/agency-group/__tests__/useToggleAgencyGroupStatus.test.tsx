import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleAgencyGroupStatus } from "../api/useToggleAgencyGroupStatus";

const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}));
vi.mock("@sol/ui", () => ({
  toast: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}));

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      patch: vi.fn().mockResolvedValue({
        id: "ag-1",
        name: "Test Group",
        description: null,
        agencyCount: 0,
        isActive: true,
      }),
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useToggleAgencyGroupStatus", () => {
  beforeEach(() => {
    mockToastSuccess.mockClear();
  });

  it("shows suspended success toast when deactivating (active: false)", async () => {
    const { result } = renderHook(() => useToggleAgencyGroupStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      agencyGroupId: "ag-1",
      active: false,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    const message = mockToastSuccess.mock.calls[0][0];
    expect(typeof message).toBe("string");
    expect(
      message.includes("suspended") ||
        message.includes("agencyGroupSuspendedSuccess")
    ).toBe(true);
  });

  it("shows reactivated success toast when activating (active: true)", async () => {
    const { result } = renderHook(() => useToggleAgencyGroupStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      agencyGroupId: "ag-1",
      active: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    const message = mockToastSuccess.mock.calls[0][0];
    expect(typeof message).toBe("string");
    expect(
      message.includes("reactivated") ||
        message.includes("agencyGroupReactivatedSuccess")
    ).toBe(true);
  });
});
