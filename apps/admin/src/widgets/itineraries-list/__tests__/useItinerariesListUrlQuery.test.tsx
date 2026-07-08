import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useItinerariesListUrlQuery } from "../model/useItinerariesListUrlQuery";

function createWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    );
  };
}

describe("useItinerariesListUrlQuery", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reflects hideCompleted and sort from URL", () => {
    const { result } = renderHook(() => useItinerariesListUrlQuery(), {
      wrapper: createWrapper(
        "/?hideCompleted=true&sort=travelDateFrom&order=desc"
      ),
    });

    expect(result.current.queryInput.hideCompleted).toBe(true);
    expect(result.current.queryInput.sort).toBe("travelDateFrom");
    expect(result.current.queryInput.order).toBe("desc");
  });

  it("does not honor postponed sort columns in URL", () => {
    const { result } = renderHook(() => useItinerariesListUrlQuery(), {
      wrapper: createWrapper("/?sort=bookedBy&order=desc"),
    });

    expect(result.current.queryInput.sort).toBeNull();
    expect(result.current.queryInput.order).toBe("desc");
  });

  it("toggleSort updates search params", () => {
    const { result } = renderHook(() => useItinerariesListUrlQuery(), {
      wrapper: createWrapper("/"),
    });

    act(() => {
      result.current.toggleSort("updatedAt");
    });

    expect(result.current.queryInput.sort).toBe("updatedAt");
    expect(result.current.queryInput.order).toBe("asc");
  });
});
