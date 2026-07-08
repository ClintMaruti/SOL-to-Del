import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";

import { createPreloadableLazy } from "@/shared/lib/preloadable-lazy";

describe("createPreloadableLazy", () => {
  it("renders the loaded component without hitting Suspense after preload resolves", async () => {
    const loader = vi.fn().mockResolvedValue({
      default: () => <div>Preloaded route content</div>,
    });
    const route = createPreloadableLazy(loader);
    const RouteElement = route.element;

    await route.preload();

    render(
      <Suspense fallback={<div>Route loader</div>}>
        <RouteElement />
      </Suspense>
    );

    expect(screen.getByText("Preloaded route content")).toBeDefined();
    expect(screen.queryByText("Route loader")).toBeNull();
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
