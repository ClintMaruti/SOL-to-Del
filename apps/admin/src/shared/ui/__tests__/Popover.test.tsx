import { render, screen, waitFor } from "@testing-library/react";
import { Popover, PopoverContent, PopoverTrigger } from "@sol/ui";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function PortalContainerPopover() {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null
  );

  return (
    <div data-testid="portal-container" ref={setPortalContainer}>
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent portalContainer={portalContainer}>
          Portalled content
        </PopoverContent>
      </Popover>
    </div>
  );
}

describe("Popover", () => {
  it("renders content inside a supplied portal container", async () => {
    render(<PortalContainerPopover />);

    await waitFor(() => {
      const portalContainer = screen.getByTestId("portal-container");
      const content = screen.getByText("Portalled content");

      expect(portalContainer.contains(content)).toBe(true);
    });
  });
});
