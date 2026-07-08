import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SaveButton } from "../SaveButton";

describe("SaveButton", () => {
  it("shows Save and primary variant when not saved", () => {
    render(<SaveButton isSavedState={false} onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn.getAttribute("data-variant")).toBe("primary");
  });

  it("shows Saved and secondary variant when saved", () => {
    render(<SaveButton isSavedState onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Saved" });
    expect(btn.getAttribute("data-variant")).toBe("secondary");
  });

  it("forwards onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SaveButton isSavedState={false} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
