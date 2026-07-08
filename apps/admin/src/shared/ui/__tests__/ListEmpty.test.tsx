import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListEmpty } from "../ListEmpty";

describe("ListEmpty", () => {
  it("renders create-style actions with the semantic primary button", () => {
    const onAction = vi.fn();

    render(
      <ListEmpty
        title="No suppliers yet"
        actionLabel="Create supplier"
        onAction={onAction}
      />
    );

    const actionButton = screen.getByRole("button", {
      name: "Create supplier",
    });
    expect(actionButton.getAttribute("data-variant")).toBe("primary");

    fireEvent.click(actionButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
