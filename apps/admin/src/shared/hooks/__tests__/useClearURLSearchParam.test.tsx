import { act, renderHook, waitFor } from "@testing-library/react";
import { useEffect, useRef, type ReactNode } from "react";
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { describe, expect, it } from "vitest";

import { useClearURLSearchParam } from "../useClearURLSearchParam";

function createWrapper(initialEntries: string[], initialIndex?: number) {
  const visitedLocations: string[] = [];
  let router: ReturnType<typeof createMemoryRouter> | null = null;

  function LocationObserver() {
    const location = useLocation();

    useEffect(() => {
      visitedLocations.push(`${location.pathname}${location.search}`);
    }, [location]);

    return null;
  }

  function Wrapper({ children }: { children: ReactNode }) {
    const routerRef = useRef<ReturnType<typeof createMemoryRouter> | null>(
      null
    );

    if (!routerRef.current) {
      routerRef.current = createMemoryRouter(
        [
          {
            path: "*",
            element: (
              <>
                {children}
                <LocationObserver />
              </>
            ),
          },
        ],
        {
          initialEntries,
          initialIndex,
        }
      );
      router = routerRef.current;
    }

    return <RouterProvider router={routerRef.current} />;
  }

  return {
    Wrapper,
    getRouter() {
      if (!router) {
        throw new Error("Router was not initialized");
      }

      return router;
    },
    visitedLocations,
  };
}

describe("useClearURLSearchParam", () => {
  it("clears the search param from the current URL", async () => {
    const { Wrapper } = createWrapper(["/agencies?search=safari"]);

    const { result } = renderHook(
      () => {
        useClearURLSearchParam();
        return useLocation();
      },
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.pathname).toBe("/agencies");
      expect(result.current.search).toBe("");
    });
  });

  it("replaces the current history entry so back navigation still reaches the previous page", async () => {
    const { Wrapper, getRouter, visitedLocations } = createWrapper(
      ["/dashboard", "/agencies?search=safari"],
      1
    );

    const { result } = renderHook(
      () => {
        useClearURLSearchParam();
        return useLocation();
      },
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.pathname).toBe("/agencies");
      expect(result.current.search).toBe("");
    });

    const locationCountBeforeBack = visitedLocations.length;

    await act(async () => {
      await getRouter().navigate(-1);
    });

    await waitFor(() => {
      expect(result.current.pathname).toBe("/dashboard");
      expect(result.current.search).toBe("");
    });

    expect(visitedLocations.slice(locationCountBeforeBack)).toEqual([
      "/dashboard",
    ]);
  });
});
